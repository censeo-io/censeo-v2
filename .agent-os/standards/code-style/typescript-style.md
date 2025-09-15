# TypeScript Style Guide

## General TypeScript Principles

### Strict Type Enforcement
- Enable all strict compiler options in tsconfig.json
- Use `strict: true` as the foundation
- Enable `noImplicitAny`, `noImplicitReturns`, `noImplicitThis`
- Use `exactOptionalPropertyTypes` for precise object typing
- Never use `any` type - use `unknown` for truly dynamic content

### Modern TypeScript Features
- Use latest stable TypeScript version
- Leverage type inference where possible, but be explicit when it improves readability
- Use union types and literal types for precise type definitions
- Utilize utility types (`Pick`, `Omit`, `Partial`, `Required`, etc.)

## Code Organization

### Import/Export Style
- Use ES6 module syntax exclusively
- Prefer named exports over default exports for better refactoring support
- Group imports: external libraries first, then internal modules
- Use type-only imports when importing only for typing

```typescript
// Type-only imports
import type { User, UserRole } from './types/user';

// Regular imports
import { useState, useEffect } from 'react';
import { api } from '../services/api';

// Local imports
import { validateEmail } from './utils/validation';
```

### Interface vs Type Aliases
- Use `interface` for object shapes that might be extended
- Use `type` for unions, primitives, computed types, and complex type manipulations
- Always prefer `interface` for React component props

```typescript
// Use interface for extensible object shapes
interface UserProps {
  id: string;
  name: string;
  email: string;
}

interface AdminUserProps extends UserProps {
  permissions: Permission[];
}

// Use type for unions and computed types
type Status = 'loading' | 'success' | 'error';
type UserKeys = keyof UserProps;
```

## Function and Variable Declarations

### Function Typing
- Always provide explicit return types for functions
- Use function declarations for top-level functions
- Use arrow functions for callbacks and inline functions
- Prefer readonly arrays and objects when data shouldn't be mutated

```typescript
function processUser(user: User): Promise<ProcessedUser> {
  return api.processUser(user);
}

const users: readonly User[] = await fetchUsers();

// Arrow function with explicit types
const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
  event.preventDefault();
  // Handle form submission
};
```

### Variable Declarations
- Use `const` by default, `let` only when reassignment is needed
- Never use `var`
- Provide explicit types when TypeScript inference is unclear
- Use meaningful, descriptive variable names

```typescript
const API_BASE_URL = 'https://api.example.com' as const;
const userPermissions: readonly Permission[] = user.permissions;

let currentStep: number = 1; // Only use let when value will change
```

## React-Specific TypeScript Patterns

### Component Props
- Always define prop interfaces
- Use generic types for reusable components
- Mark optional props clearly
- Use discriminated unions for complex prop variations

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

// Generic component
interface ListProps<T> {
  items: readonly T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}
```

### Hooks Typing
- Type custom hooks properly
- Use generic types for reusable hooks
- Always type hook return values explicitly

```typescript
// Custom hook with proper typing
function useApi<T>(url: string): {
  data: T | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [url]);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(url);
      const result: T = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error };
}
```

## API and Data Handling

### API Response Types
- Define strict types for all API responses
- Use discriminated unions for different response states
- Validate API responses at runtime when possible

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiError {
  success: false;
  error: string;
  code: number;
}

type UserApiResponse = ApiResponse<User> | ApiError;

// Runtime validation helper
function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false
  );
}
```

### Form Handling
- Type form data structures strictly
- Use controlled components with proper event typing
- Implement proper validation with typed error objects

```typescript
interface LoginForm {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function LoginComponent(): JSX.Element {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form content */}
    </form>
  );
}
```

## Error Handling and Validation

### Error Types
- Create specific error types for different scenarios
- Use discriminated unions for error handling
- Implement proper error boundaries with typed errors

```typescript
class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Type guard functions
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
```

## Utility Types and Helpers

### Custom Utility Types
- Create reusable utility types for common patterns
- Use template literal types for string manipulation
- Implement proper type guards and assertion functions

```typescript
// Custom utility types
type NonEmptyArray<T> = [T, ...T[]];
type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Template literal types
type EventName<T extends string> = `on${Capitalize<T>}`;
type ApiEndpoint<T extends string> = `/api/${T}`;

// Type guard
function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}

// Assertion function
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
}
```

## Performance and Best Practices

### Code Splitting Types
- Use dynamic imports with proper typing
- Implement lazy loading with error boundaries
- Type async components properly

```typescript
// Lazy component with proper typing
const LazyUserDashboard = React.lazy(
  (): Promise<{ default: React.ComponentType<UserDashboardProps> }> =>
    import('./UserDashboard')
);

// Higher-order component with proper generics
function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { loading?: boolean }> {
  return function WithLoadingComponent(props) {
    const { loading, ...restProps } = props;

    if (loading) {
      return <div>Loading...</div>;
    }

    return <Component {...(restProps as P)} />;
  };
}
```

### Memoization
- Type memo and callback hooks properly
- Use proper dependency arrays with exhaustive-deps ESLint rule
- Implement proper equality checks for complex objects

```typescript
const ExpensiveComponent = React.memo<ExpensiveComponentProps>(
  ({ data, onUpdate }) => {
    const processedData = useMemo(
      (): ProcessedData => processData(data),
      [data]
    );

    const handleUpdate = useCallback(
      (id: string): void => {
        onUpdate(id);
      },
      [onUpdate]
    );

    return (
      <div>
        {/* Component content */}
      </div>
    );
  }
);
```
