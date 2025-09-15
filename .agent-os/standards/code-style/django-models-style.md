# Django Models & Database Style Guide

## Model Design Principles

### Model Structure
- Use singular names for model classes: `User`, not `Users`
- Order fields logically: required first, optional second, timestamps last
- Always include `__str__` method for meaningful representations
- Use descriptive field names that clearly indicate their purpose

```python
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator, RegexValidator

class User(AbstractUser):
    # Required fields
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    # Optional fields
    bio = models.TextField(blank=True, max_length=500)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Timestamps (Django provides created/updated if using TimestampedModel)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['date_joined']),
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} ({self.email})"

    def get_full_name(self) -> str:
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()
```

### Field Types and Constraints
- Use appropriate field types for data
- Add database-level constraints when possible
- Use validators for business logic constraints
- Be explicit about `null` and `blank` parameters

```python
class Post(models.Model):
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)]
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        db_index=True
    )
    content = models.TextField(
        validators=[MinLengthValidator(10)]
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('published', 'Published'),
            ('archived', 'Archived'),
        ],
        default='draft',
        db_index=True
    )

    # Foreign key relationships
    author = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='posts'
    )
    category = models.ForeignKey(
        'Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts'
    )

    # Many-to-many relationships
    tags = models.ManyToManyField(
        'Tag',
        blank=True,
        related_name='posts'
    )

    # Optional fields
    featured_image = models.ImageField(
        upload_to='posts/images/',
        blank=True,
        null=True
    )
    excerpt = models.CharField(
        max_length=300,
        blank=True,
        help_text="Brief description of the post"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['published_at']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(title__length__gte=3),
                name='post_title_min_length'
            ),
            models.UniqueConstraint(
                fields=['author', 'slug'],
                name='unique_author_slug'
            ),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        # Auto-generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.title)

        # Set published_at when status changes to published
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        elif self.status != 'published':
            self.published_at = None

        super().save(*args, **kwargs)
```

## Relationship Patterns

### Foreign Key Relationships
- Always specify `on_delete` behavior explicitly
- Use meaningful `related_name` attributes
- Consider the impact of cascading deletes

```python
class Comment(models.Model):
    post = models.ForeignKey(
        'Post',
        on_delete=models.CASCADE,  # Delete comments when post is deleted
        related_name='comments'
    )
    author = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,  # Delete comments when user is deleted
        related_name='comments'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,  # Nested comments
        null=True,
        blank=True,
        related_name='replies'
    )

    content = models.TextField(validators=[MinLengthValidator(3)])
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', '-created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['is_approved']),
        ]
```

### Many-to-Many Relationships
- Use through models for additional data on relationships
- Consider performance implications of many-to-many queries

```python
class Follow(models.Model):
    """Through model for user follows with additional metadata."""
    follower = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='following_relationships'
    )
    followed = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='follower_relationships'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    notifications_enabled = models.BooleanField(default=True)

    class Meta:
        unique_together = [['follower', 'followed']]
        indexes = [
            models.Index(fields=['follower', '-created_at']),
            models.Index(fields=['followed', '-created_at']),
        ]

    def __str__(self) -> str:
        return f"{self.follower} follows {self.followed}"

# Usage in User model
class User(AbstractUser):
    following = models.ManyToManyField(
        'self',
        through='Follow',
        symmetrical=False,
        related_name='followers'
    )
```

## Custom Managers and QuerySets

### Custom QuerySet Methods
- Create reusable query methods for common operations
- Chain QuerySet methods for complex queries
- Use meaningful method names that describe the query

```python
class PostQuerySet(models.QuerySet):
    def published(self):
        """Return only published posts."""
        return self.filter(status='published', published_at__isnull=False)

    def by_author(self, author):
        """Filter posts by specific author."""
        return self.filter(author=author)

    def recent(self, days=30):
        """Return posts from the last N days."""
        cutoff_date = timezone.now() - timedelta(days=days)
        return self.filter(created_at__gte=cutoff_date)

    def with_tags(self, *tag_names):
        """Filter posts that have any of the specified tags."""
        return self.filter(tags__name__in=tag_names).distinct()

    def popular(self, min_likes=10):
        """Return posts with at least N likes."""
        return self.annotate(
            likes_count=models.Count('likes')
        ).filter(likes_count__gte=min_likes)

    def optimized_list(self):
        """Optimize queryset for list views."""
        return self.select_related(
            'author', 'category'
        ).prefetch_related('tags')

class PostManager(models.Manager):
    def get_queryset(self):
        return PostQuerySet(self.model, using=self._db)

    def published(self):
        return self.get_queryset().published()

    def recent_published(self, days=7):
        return self.get_queryset().published().recent(days)

# Usage in model
class Post(models.Model):
    # ... fields ...

    objects = PostManager()

    class Meta:
        # ... meta options ...
```

## Database Migrations Best Practices

### Migration Structure
- Keep migrations small and focused
- Use descriptive migration names
- Test migrations on production-like data
- Plan for rollbacks

```python
# Example migration file: 0001_add_user_profile_fields.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('myapp', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='bio',
            field=models.TextField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name='user',
            name='website',
            field=models.URLField(blank=True),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['email'], name='user_email_idx'),
        ),
    ]
```

### Data Migrations
- Separate schema changes from data changes
- Use `RunPython` for data transformations
- Always provide reverse operations

```python
# Data migration example
from django.db import migrations

def populate_slugs(apps, schema_editor):
    """Generate slugs for existing posts."""
    Post = apps.get_model('myapp', 'Post')
    from django.utils.text import slugify

    for post in Post.objects.filter(slug=''):
        post.slug = slugify(post.title)
        post.save()

def reverse_populate_slugs(apps, schema_editor):
    """Clear slugs (for rollback)."""
    Post = apps.get_model('myapp', 'Post')
    Post.objects.update(slug='')

class Migration(migrations.Migration):
    dependencies = [
        ('myapp', '0002_add_slug_field'),
    ]

    operations = [
        migrations.RunPython(
            populate_slugs,
            reverse_populate_slugs
        ),
    ]
```

## Performance Optimization

### Database Indexes
- Add indexes for frequently queried fields
- Use composite indexes for multi-field queries
- Monitor query performance in production

```python
class Post(models.Model):
    # ... fields ...

    class Meta:
        # Single-field indexes
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['author']),

            # Composite indexes for common query patterns
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['category', 'status', '-created_at']),

            # Partial indexes (PostgreSQL)
            models.Index(
                fields=['created_at'],
                condition=models.Q(status='published'),
                name='published_posts_created_idx'
            ),
        ]
```

### Model Methods for Optimization
- Create methods that use `select_related()` and `prefetch_related()`
- Cache expensive computations
- Use database functions when appropriate

```python
from django.db.models import Count, Q, F
from django.core.cache import cache

class User(AbstractUser):
    def get_post_stats(self):
        """Get cached post statistics for user."""
        cache_key = f"user_post_stats_{self.id}"
        stats = cache.get(cache_key)

        if stats is None:
            stats = self.posts.aggregate(
                total_posts=Count('id'),
                published_posts=Count('id', filter=Q(status='published')),
                total_likes=Count('likes')
            )
            cache.set(cache_key, stats, timeout=300)  # 5 minutes

        return stats

    @classmethod
    def with_post_counts(cls):
        """QuerySet with annotated post counts."""
        return cls.objects.annotate(
            total_posts=Count('posts'),
            published_posts=Count(
                'posts',
                filter=Q(posts__status='published')
            )
        )
```

## Model Validation

### Custom Validators
- Create reusable validators for business logic
- Use both field-level and model-level validation
- Provide clear error messages

```python
from django.core.exceptions import ValidationError
from django.core.validators import BaseValidator
import re

class UsernameValidator(BaseValidator):
    """Validator for username format."""
    message = "Username must contain only letters, numbers, hyphens, and underscores."
    code = 'invalid_username'

    def __call__(self, value):
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise ValidationError(self.message, code=self.code)

class User(AbstractUser):
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[
            MinLengthValidator(3),
            UsernameValidator()
        ]
    )

    def clean(self):
        """Model-level validation."""
        super().clean()

        # Custom business logic validation
        if self.email and User.objects.filter(
            email__iexact=self.email
        ).exclude(pk=self.pk).exists():
            raise ValidationError({
                'email': 'A user with this email already exists.'
            })

    def save(self, *args, **kwargs):
        # Always call clean before saving
        self.clean()
        super().save(*args, **kwargs)
```

## Testing Models

### Model Testing Patterns
- Test model creation, validation, and relationships
- Use factories for test data generation
- Test custom methods and properties

```python
# tests/test_models.py
from django.test import TestCase
from django.core.exceptions import ValidationError
from myapp.models import User, Post

class UserModelTest(TestCase):
    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
        }

    def test_user_creation(self):
        """Test user can be created with valid data."""
        user = User.objects.create(**self.user_data)
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.is_active)

    def test_user_str_representation(self):
        """Test user string representation."""
        user = User.objects.create(**self.user_data)
        expected = "Test User (test@example.com)"
        self.assertEqual(str(user), expected)

    def test_user_full_name(self):
        """Test get_full_name method."""
        user = User.objects.create(**self.user_data)
        self.assertEqual(user.get_full_name(), "Test User")

    def test_duplicate_email_validation(self):
        """Test that duplicate emails are not allowed."""
        User.objects.create(**self.user_data)

        with self.assertRaises(ValidationError):
            duplicate_user = User(**self.user_data)
            duplicate_user.email = 'TEST@EXAMPLE.COM'  # Case insensitive
            duplicate_user.clean()
```
