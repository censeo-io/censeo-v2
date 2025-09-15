# CSS Style Guide

## TailwindCSS with React/JSX

We always use the latest version of TailwindCSS for all styling in React components.

### Multi-line CSS classes in JSX

- Use the same multi-line formatting style when writing Tailwind CSS classes in JSX `className` props
- Classes for each responsive size are written on their own dedicated line
- The top-most line should be the smallest size (no responsive prefix). Each line below it should be the next responsive size up
- Each line of CSS classes should be aligned vertically
- Focus, hover, and other state classes should be on their own additional dedicated lines
- We implement one additional responsive breakpoint size called 'xs' which represents 400px
- If there are any custom CSS classes being used, those should be included at the start of the first line

**Example of multi-line Tailwind CSS classes in JSX:**

```typescript
<div className="custom-cta bg-gray-50 dark:bg-gray-900 p-4 rounded cursor-pointer w-full
                hover:bg-gray-100 dark:hover:bg-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-500
                xs:p-6
                sm:p-8 sm:font-medium
                md:p-10 md:text-lg
                lg:p-12 lg:text-xl lg:font-semibold lg:w-3/5
                xl:p-14 xl:text-2xl
                2xl:p-16 2xl:text-3xl 2xl:font-bold 2xl:w-3/4">
  I'm a call-to-action!
</div>
```

### Dynamic Classes with TypeScript

When building dynamic className strings, use proper TypeScript typing and template literals:

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

function Button({ variant, size, disabled = false }: ButtonProps): JSX.Element {
  const baseClasses = 'font-semibold rounded transition-colors duration-200';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}
                     ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                     focus:outline-none focus:ring-2 focus:ring-offset-2`;

  return (
    <button
      className={className}
      disabled={disabled}>
      {children}
    </button>
  );
}
```

### Utility Functions for Classes

Create utility functions for commonly used class combinations:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge Tailwind classes properly
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Example usage
function Card({ className, ...props }: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-6 shadow-sm',
        'dark:border-gray-800 dark:bg-gray-950',
        className
      )}
      {...props}
    />
  );
}
```

### Component-Level CSS Variables

For complex theming, use CSS custom properties with Tailwind:

```typescript
function ThemeProvider({ children, theme }: ThemeProviderProps): JSX.Element {
  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        '--color-primary': theme.colors.primary,
        '--color-secondary': theme.colors.secondary,
        '--border-radius': theme.borderRadius
      } as React.CSSProperties}>
      {children}
    </div>
  );
}

// Use in components
function CustomButton(): JSX.Element {
  return (
    <button className="bg-[var(--color-primary)] rounded-[var(--border-radius)]">
      Click me
    </button>
  );
}
```

### Responsive Design Patterns

Use consistent responsive patterns across components:

```typescript
function ResponsiveGrid({ children }: ResponsiveGridProps): JSX.Element {
  return (
    <div className="grid gap-4 p-4
                    grid-cols-1
                    xs:gap-6 xs:p-6
                    sm:grid-cols-2 sm:gap-8 sm:p-8
                    md:grid-cols-3
                    lg:grid-cols-4 lg:gap-10
                    xl:grid-cols-5
                    2xl:grid-cols-6 2xl:gap-12">
      {children}
    </div>
  );
}
```

### Animation and Transition Guidelines

- Use Tailwind's built-in transition utilities
- Keep animations subtle and purposeful
- Provide reduced motion alternatives

```typescript
function AnimatedCard({ isVisible }: AnimatedCardProps): JSX.Element {
  return (
    <div className={`transform transition-all duration-300 ease-in-out
                     ${isVisible
                       ? 'translate-y-0 opacity-100'
                       : 'translate-y-4 opacity-0'}
                     motion-reduce:transition-none
                     motion-reduce:transform-none`}>
      Card content
    </div>
  );
}
```

### Dark Mode Implementation

Use Tailwind's dark mode classes consistently:

```typescript
function Header(): JSX.Element {
  return (
    <header className="bg-white border-b border-gray-200
                       dark:bg-gray-900 dark:border-gray-700
                       transition-colors duration-200">
      <h1 className="text-gray-900 dark:text-white">
        Application Title
      </h1>
    </header>
  );
}
```

### Custom CSS Integration

When custom CSS is needed, use CSS Modules or styled-components with Tailwind:

```typescript
// styles.module.css
.customGradient {
  @apply bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500;
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

// Component
import styles from './styles.module.css';

function GradientButton(): JSX.Element {
  return (
    <button className={`${styles.customGradient} px-6 py-3 rounded-lg text-white font-semibold
                        hover:scale-105 transform transition-transform duration-200`}>
      Gradient Button
    </button>
  );
}
```

### Performance Best Practices

- Use Tailwind's purge/content configuration to remove unused styles
- Prefer Tailwind utilities over custom CSS when possible
- Group related classes logically for better readability
- Use the `cn()` utility function to avoid class conflicts
