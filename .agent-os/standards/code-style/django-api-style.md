# Django API Style Guide

## Django REST Framework Best Practices

### Serializer Design

#### Field Declarations
- Always declare fields explicitly when possible
- Use `read_only_fields` in Meta for immutable fields
- Order fields logically: required fields first, then optional

```python
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'avatar_url', 'is_active', 'date_joined',
            'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def get_full_name(self, obj: User) -> str:
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_avatar_url(self, obj: User) -> Optional[str]:
        if obj.profile and obj.profile.avatar:
            return self.context['request'].build_absolute_uri(
                obj.profile.avatar.url
            )
        return None
```

#### Nested Serializers
- Use separate serializers for nested relationships
- Be explicit about depth to avoid performance issues
- Use `to_representation` for complex nested data formatting

```python
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['bio', 'location', 'website', 'avatar']

class UserDetailSerializer(UserSerializer):
    profile = UserProfileSerializer(read_only=True)
    posts_count = serializers.IntegerField(read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['profile', 'posts_count']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add computed fields
        data['posts_count'] = instance.posts.count()
        return data
```

### ViewSet Organization

#### Standard ViewSet Structure
- Inherit from appropriate base classes
- Override methods in logical order
- Use descriptive method names for custom actions

```python
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'username']
    ordering = ['-date_joined']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'retrieve':
            queryset = queryset.select_related('profile')
        return queryset

    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        user = self.get_object()
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'message': 'Password updated successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

#### Custom Actions
- Use clear, RESTful action names
- Document action parameters and responses
- Handle permissions appropriately

```python
class PostViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Like or unlike a post.
        Returns: {'liked': boolean, 'likes_count': number}
        """
        post = self.get_object()
        user = request.user

        like, created = Like.objects.get_or_create(post=post, user=user)
        if not created:
            like.delete()
            liked = False
        else:
            liked = True

        return Response({
            'liked': liked,
            'likes_count': post.likes.count()
        })

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """
        Get trending posts from the last week.
        Query params: limit (default: 10)
        """
        week_ago = timezone.now() - timedelta(days=7)
        limit = int(request.query_params.get('limit', 10))

        trending_posts = Post.objects.filter(
            created_at__gte=week_ago
        ).annotate(
            likes_count=Count('likes')
        ).order_by('-likes_count')[:limit]

        serializer = self.get_serializer(trending_posts, many=True)
        return Response(serializer.data)
```

### API Response Patterns

#### Consistent Response Structure
- Use consistent response formats across endpoints
- Include metadata for paginated responses
- Provide meaningful error messages

```python
# views.py
from rest_framework.response import Response
from rest_framework import status

class StandardResponseMixin:
    def success_response(self, data=None, message=None, status_code=status.HTTP_200_OK):
        response_data = {
            'success': True,
            'data': data,
        }
        if message:
            response_data['message'] = message
        return Response(response_data, status=status_code)

    def error_response(self, errors, message=None, status_code=status.HTTP_400_BAD_REQUEST):
        response_data = {
            'success': False,
            'errors': errors,
        }
        if message:
            response_data['message'] = message
        return Response(response_data, status=status_code)

class UserViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return self.success_response(
                data=UserSerializer(user).data,
                message="User created successfully",
                status_code=status.HTTP_201_CREATED
            )
        return self.error_response(
            errors=serializer.errors,
            message="User creation failed"
        )
```

#### Pagination Standards
- Use consistent pagination across all list endpoints
- Include pagination metadata in responses

```python
# pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class StandardPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'success': True,
            'data': {
                'results': data,
                'pagination': {
                    'count': self.page.paginator.count,
                    'total_pages': self.page.paginator.num_pages,
                    'current_page': self.page.number,
                    'page_size': self.get_page_size(self.request),
                    'next': self.get_next_link(),
                    'previous': self.get_previous_link(),
                }
            }
        })

# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'myapp.pagination.StandardPageNumberPagination',
}
```

### Validation and Error Handling

#### Custom Validation
- Implement field-level and object-level validation
- Use descriptive error messages
- Validate business logic constraints

```python
class UserRegistrationSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 8}
        }

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_username(self, value: str) -> str:
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        if not value.replace('_', '').replace('-', '').isalnum():
            raise serializers.ValidationError("Username can only contain letters, numbers, hyphens, and underscores.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs

    def create(self, validated_data: dict) -> User:
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user
```

#### Exception Handling
- Create custom exception handlers for consistent error responses
- Log errors appropriately
- Don't expose sensitive information in error messages

```python
# exceptions.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(exc, ValidationError):
            custom_response_data = {
                'success': False,
                'message': 'Validation failed',
                'errors': response.data
            }
        else:
            custom_response_data = {
                'success': False,
                'message': str(exc),
                'errors': response.data
            }

        # Log the error
        logger.error(f"API Error: {exc}", exc_info=True, extra={
            'request': context.get('request'),
            'view': context.get('view')
        })

        response.data = custom_response_data

    return response

# settings.py
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'myapp.exceptions.custom_exception_handler'
}
```

### Authentication and Permissions

#### Token-Based Authentication
- Use Django REST framework's token authentication with custom extensions
- Implement proper token refresh mechanisms

```python
# authentication.py
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from django.utils import timezone
from datetime import timedelta

class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            token = model.objects.select_related('user').get(key=key)
        except model.DoesNotExist:
            raise AuthenticationFailed('Invalid token.')

        if not token.user.is_active:
            raise AuthenticationFailed('User inactive or deleted.')

        # Check if token has expired (24 hours)
        if token.created < timezone.now() - timedelta(hours=24):
            raise AuthenticationFailed('Token has expired.')

        return (token.user, token)
```

#### Custom Permissions
- Create reusable permission classes
- Use descriptive permission names

```python
# permissions.py
from rest_framework.permissions import BasePermission

class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions for any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True

        # Write permissions only for owner
        return obj.owner == request.user

class IsAdminOrOwner(BasePermission):
    """
    Permission for admin users or object owners.
    """
    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_staff or
            getattr(obj, 'owner', None) == request.user
        )
```

### API Documentation

#### ViewSet Documentation
- Use docstrings for automatic API documentation
- Document custom actions thoroughly

```python
class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing blog posts.

    list: Get all posts with pagination and filtering
    create: Create a new post (authenticated users only)
    retrieve: Get a specific post by ID
    update: Update a post (owner or admin only)
    destroy: Delete a post (owner or admin only)
    """

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """
        Like or unlike a post.

        - **POST** `/posts/{id}/like/`
        - **Permission**: Authenticated users only
        - **Response**:
          ```json
          {
            "success": true,
            "data": {
              "liked": true,
              "likes_count": 42
            }
          }
          ```
        """
        # Implementation here
```

### Performance Optimization

#### Database Query Optimization
- Use `select_related()` and `prefetch_related()` appropriately
- Implement custom queryset methods for reusable optimizations

```python
class PostViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        queryset = Post.objects.all()

        if self.action == 'list':
            queryset = queryset.select_related('author').prefetch_related(
                'tags', 'likes'
            ).annotate(
                likes_count=Count('likes'),
                comments_count=Count('comments')
            )
        elif self.action == 'retrieve':
            queryset = queryset.select_related('author').prefetch_related(
                'tags', 'comments__author', 'likes'
            )

        return queryset
```

#### Caching Strategies
- Cache expensive computations and frequent queries
- Use appropriate cache keys and timeouts

```python
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class PostViewSet(viewsets.ModelViewSet):
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    @action(detail=False)
    def trending(self, request):
        cache_key = f"trending_posts_{request.GET.get('limit', 10)}"
        cached_data = cache.get(cache_key)

        if cached_data is None:
            # Expensive computation here
            trending_posts = self.get_trending_posts()
            serializer = self.get_serializer(trending_posts, many=True)
            cached_data = serializer.data
            cache.set(cache_key, cached_data, 60 * 30)  # Cache for 30 minutes

        return Response({'success': True, 'data': cached_data})
```
