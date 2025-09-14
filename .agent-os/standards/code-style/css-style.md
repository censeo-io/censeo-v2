# CSS Style Guide

We use Tailwind CSS with shadcn/ui components for all styling with custom CSS for application-specific needs.

## Tailwind CSS Usage

### Component Styling
- Use Tailwind utility classes for styling with consistent design tokens
- Leverage shadcn/ui components for common UI elements (buttons, cards, forms, dialogs)
- Follow Tailwind's design system for spacing, colors, and typography
- Use shadcn/ui's built-in accessibility features

### Custom CSS Guidelines
- Use CSS custom properties (variables) for application-specific values
- Follow BEM methodology for custom class naming when needed
- Keep custom styles scoped to components using CSS modules or styled-components
- Use Tailwind's @apply directive for component-level abstractions

### Responsive Design
- Utilize Tailwind's responsive prefix system:
  - sm: 640px+
  - md: 768px+
  - lg: 1024px+
  - xl: 1280px+
  - 2xl: 1536px+

### Multi-line CSS classes in markup

- We use a unique multi-line formatting style when writing Tailwind CSS classes in HTML markup and JSX, where the classes for each responsive size are written on their own dedicated line.
- The top-most line should be the smallest size (no responsive prefix). Each line below it should be the next responsive size up.
- Each line of CSS classes should be aligned vertically.
- focus and hover classes should be on their own additional dedicated lines.

**Example of multi-line Tailwind CSS classes:**

```tsx
<div className="bg-gray-50 dark:bg-gray-900 p-4 rounded cursor-pointer w-full
               hover:bg-gray-100 dark:hover:bg-gray-800
               sm:p-8 sm:font-medium
               md:p-10 md:text-lg
               lg:p-12 lg:text-xl lg:font-semibold lg:w-3/5
               xl:p-14 xl:text-2xl
               2xl:p-16 2xl:text-3xl 2xl:font-bold 2xl:w-3/4">
  I'm a call-to-action!
</div>
```

**Example of shadcn/ui component with Tailwind styling:**

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StoryCard({ story }: { story: Story }) {
  return (
    <Card className="mx-4 max-w-sm
                     hover:shadow-md
                     sm:max-w-md
                     lg:max-w-lg">
      <CardHeader>
        <CardTitle className="text-lg
                             sm:text-xl
                             lg:text-2xl">
          {story.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[60px] text-sm
                             sm:text-base
                             lg:min-h-[80px]">
        <p className="text-muted-foreground mb-4">
          {story.description}
        </p>
        <Button variant="default" size="sm"
                className="w-full
                           sm:w-auto">
          Vote
        </Button>
      </CardContent>
    </Card>
  )
}
```