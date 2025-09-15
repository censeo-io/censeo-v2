# Python Style Guide

## General Python Formatting

### PEP 8 Compliance
- Follow PEP 8 as the foundation for all Python code
- Use automated formatters like `black` and `ruff` for consistent formatting
- Line length: 88 characters (black default)
- Use 4 spaces for indentation (never tabs)

### Import Organization
- Group imports in this order:
  1. Standard library imports
  2. Related third-party imports
  3. Local application/library imports
- Use absolute imports when possible
- Place imports at the top of the file, after module docstrings
- Use `from` imports sparingly and only for commonly used items

```python
# Standard library
import os
import sys
from datetime import datetime
from typing import Optional, List, Dict, Any

# Third-party
from django.contrib.auth.models import User
from django.db import models
from rest_framework import serializers

# Local
from .models import UserProfile
from ..utils import format_date
```

### String Formatting
- Use f-strings for string interpolation (Python 3.6+)
- Use single quotes for simple strings
- Use double quotes when string contains single quotes
- Use triple double quotes for docstrings

```python
name = 'John'
message = f"Hello {name}!"
sql_query = "SELECT * FROM users WHERE name = 'John'"
```

## Django-Specific Style

### Models
- Use singular names for model classes: `User`, not `Users`
- Use descriptive field names
- Always add `__str__` method to models
- Use `related_name` for foreign keys and many-to-many fields
- Order model fields logically: required fields first, then optional

```python
class User(models.Model):
    # Required fields
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    # Optional fields
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
```

### Views and ViewSets
- Use class-based views (CBVs) for complex logic
- Use function-based views (FBVs) for simple operations
- Keep view logic minimal - move business logic to services or managers
- Use meaningful variable names

```python
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset.filter(is_active=True)
        return queryset.none()
```

### Serializers
- Use explicit field declarations when possible
- Validate data in serializer methods
- Use descriptive method names for custom validation

```python
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name']
        read_only_fields = ['id']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
```

## Code Organization

### Project Structure
- Use Django's recommended project structure
- Create separate apps for distinct functionality
- Keep business logic in services or managers
- Use meaningful package and module names

### Function and Class Design
- Functions should do one thing well
- Keep functions small (generally under 20 lines)
- Use type hints for function parameters and return values
- Write descriptive docstrings for complex functions

```python
from typing import Optional, List
from django.contrib.auth.models import User

def get_active_users(limit: Optional[int] = None) -> List[User]:
    """
    Retrieve active users from the database.

    Args:
        limit: Maximum number of users to return

    Returns:
        List of active User instances
    """
    queryset = User.objects.filter(is_active=True)
    if limit:
        queryset = queryset[:limit]
    return list(queryset)
```

## Error Handling

### Exception Handling
- Be specific with exception types
- Use Django's built-in exceptions when appropriate
- Log errors appropriately
- Don't catch exceptions you can't handle

```python
from django.core.exceptions import ValidationError
from django.http import Http404
import logging

logger = logging.getLogger(__name__)

def get_user_by_id(user_id: int) -> User:
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning(f"User with id {user_id} not found")
        raise Http404("User not found")
    except ValidationError as e:
        logger.error(f"Validation error for user {user_id}: {e}")
        raise
```

## Testing Style

### Test Organization
- Use descriptive test method names
- Group related tests in test classes
- Use Django's TestCase for database tests
- Use setUp method for common test data

```python
from django.test import TestCase
from django.contrib.auth.models import User

class UserModelTest(TestCase):
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'first_name': 'John',
            'last_name': 'Doe'
        }

    def test_user_creation_with_valid_data(self):
        user = User.objects.create(**self.user_data)
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.is_active)

    def test_user_str_representation(self):
        user = User.objects.create(**self.user_data)
        self.assertEqual(str(user), 'John Doe')
```

## Performance Considerations

### Database Queries
- Use `select_related()` for foreign key relationships
- Use `prefetch_related()` for many-to-many and reverse foreign key relationships
- Avoid N+1 query problems
- Use `only()` and `defer()` when appropriate

```python
# Good: Use select_related for foreign keys
users = User.objects.select_related('profile').all()

# Good: Use prefetch_related for many-to-many
users = User.objects.prefetch_related('groups').all()

# Good: Only fetch needed fields
users = User.objects.only('email', 'first_name').all()
```

### Caching
- Use Django's caching framework appropriately
- Cache expensive computations and database queries
- Use appropriate cache timeouts

```python
from django.core.cache import cache

def get_user_count():
    count = cache.get('user_count')
    if count is None:
        count = User.objects.count()
        cache.set('user_count', count, timeout=300)  # 5 minutes
    return count
```
