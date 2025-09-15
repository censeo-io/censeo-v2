# JSX Style Guide

## General JSX Structure Rules
- Use 2 spaces for indentation
- Place nested elements on new lines with proper indentation
- Use meaningful component names in PascalCase
- Always use self-closing tags for elements without children
- Use `className` instead of `class` for CSS classes
- Use camelCase for all props and event handlers

## Component Structure
- Order component elements: imports, types, component function, export
- Use function components with TypeScript interfaces for props
- Keep components focused on a single responsibility

```typescript
import React from 'react';
import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  children?: ReactNode;
  className?: string;
}

function Header({ title, children, className = '' }: HeaderProps): JSX.Element {
  return (
    <header className={`flex flex-col space-y-2 ${className}
                        md:flex-row md:space-y-0 md:space-x-4`}>
      <h1 className="text-primary dark:text-primary-300">
        {title}
      </h1>
      {children && (
        <nav className="flex flex-col space-y-2
                       md:flex-row md:space-y-0 md:space-x-4">
          {children}
        </nav>
      )}
    </header>
  );
}

export default Header;
```

## Attribute and Props Formatting

### Single-Line vs Multi-Line
- Use single line for components with 1-2 simple props
- Use multi-line formatting for components with 3+ props or complex values
- Place each prop on its own line when using multi-line format
- Align props vertically for better readability

```typescript
// Single line for simple components
<Button onClick={handleClick} variant="primary" />

// Multi-line for complex components
<UserCard
  user={currentUser}
  onEdit={handleUserEdit}
  onDelete={handleUserDelete}
  showActions={isAdmin}
  className="mb-4"
/>
```

### Boolean Props
- Use implicit `true` for boolean props
- Be explicit when passing `false` or conditional values

```typescript
// Good: implicit true
<Modal open dismissible />

// Good: explicit false or conditional
<Modal open={false} dismissible={canDismiss} />
```

## Event Handlers
- Use descriptive handler names with `handle` prefix
- Define handlers outside JSX when they contain logic
- Use inline handlers only for simple operations

```typescript
function UserProfile({ user }: UserProfileProps): JSX.Element {
  const handleEditClick = (): void => {
    // Complex logic here
    setEditMode(true);
    trackUserAction('edit_profile_clicked');
  };

  return (
    <div className="user-profile">
      <button
        onClick={handleEditClick}
        className="btn-primary">
        Edit Profile
      </button>

      {/* Simple inline handler */}
      <button
        onClick={() => setShowModal(false)}
        className="btn-secondary">
        Cancel
      </button>
    </div>
  );
}
```

## Conditional Rendering
- Use logical AND (`&&`) for simple conditional rendering
- Use ternary operator for if-else rendering
- Extract complex conditions to variables for readability

```typescript
function Dashboard({ user, notifications }: DashboardProps): JSX.Element {
  const hasNotifications = notifications.length > 0;
  const isAdmin = user.role === 'admin';

  return (
    <div className="dashboard">
      {/* Simple conditional rendering */}
      {isAdmin && (
        <AdminPanel />
      )}

      {/* If-else rendering */}
      {hasNotifications ? (
        <NotificationList notifications={notifications} />
      ) : (
        <EmptyState message="No notifications" />
      )}

      {/* Complex condition extracted to variable */}
      {hasNotifications && isAdmin && (
        <NotificationSettings />
      )}
    </div>
  );
}
```

## Lists and Keys
- Always provide unique `key` props for list items
- Use stable, meaningful keys (IDs when available)
- Never use array index as key unless list is static

```typescript
function UserList({ users }: UserListProps): JSX.Element {
  return (
    <ul className="user-list">
      {users.map(user => (
        <li key={user.id} className="user-item">
          <UserCard user={user} />
        </li>
      ))}
    </ul>
  );
}
```

## Component Composition
- Use composition over complex prop drilling
- Implement proper children patterns
- Use render props or custom hooks for shared logic

```typescript
// Good: Composition pattern
function Card({ children, title }: CardProps): JSX.Element {
  return (
    <div className="card">
      {title && (
        <header className="card-header">
          <h3>{title}</h3>
        </header>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

// Usage
function UserProfile(): JSX.Element {
  return (
    <Card title="User Information">
      <UserDetails user={currentUser} />
      <UserActions user={currentUser} />
    </Card>
  );
}
```

## Accessibility (a11y) Requirements
- Always include proper ARIA labels and roles
- Ensure keyboard navigation works properly
- Use semantic HTML elements within JSX
- Provide alt text for images

```typescript
function NavigationMenu({ items }: NavigationMenuProps): JSX.Element {
  return (
    <nav role="navigation" aria-label="Main navigation">
      <ul className="nav-list">
        {items.map(item => (
          <li key={item.id}>
            <a
              href={item.href}
              aria-current={item.isActive ? 'page' : undefined}
              className={`nav-link ${item.isActive ? 'active' : ''}`}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

## Error Boundaries and Error Handling
- Wrap components that might error with error boundaries
- Provide meaningful error states
- Handle loading states appropriately

```typescript
function UserDashboard(): JSX.Element {
  const { data: user, loading, error } = useUser();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner aria-label="Loading user data" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load user data"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div className="dashboard">
        <UserProfile user={user} />
        <UserStats user={user} />
      </div>
    </ErrorBoundary>
  );
}
```

## Performance Considerations
- Use React.memo for components that re-render frequently
- Implement proper dependency arrays in useEffect and useCallback
- Avoid creating objects or arrays inline in render

```typescript
const UserCard = React.memo<UserCardProps>(({ user, onEdit }) => {
  const handleEdit = useCallback((): void => {
    onEdit(user.id);
  }, [user.id, onEdit]);

  const userDisplayData = useMemo(() => ({
    fullName: `${user.firstName} ${user.lastName}`,
    memberSince: formatDate(user.createdAt)
  }), [user.firstName, user.lastName, user.createdAt]);

  return (
    <div className="user-card">
      <h3>{userDisplayData.fullName}</h3>
      <p>Member since: {userDisplayData.memberSince}</p>
      <button onClick={handleEdit}>
        Edit
      </button>
    </div>
  );
});
```
