# Coming Soon Components

This document explains how to use the Coming Soon components to handle non-existent pages and features gracefully.

## Components Available

### 1. `ComingSoon` - Main Component
A flexible component that wraps any content and shows a "Coming Soon" dialog when clicked.

```tsx
import { ComingSoon } from '@/components/ComingSoon'

// Basic usage
<ComingSoon>
  <Button>Feature Button</Button>
</ComingSoon>

// With custom title and description
<ComingSoon 
  title="Advanced Analytics" 
  description="This feature will provide detailed insights and reports."
>
  <Button>View Analytics</Button>
</ComingSoon>
```

### 2. `ComingSoonPage` - Full Page Component
A standalone page component for showing "Coming Soon" messages.

```tsx
import { ComingSoonPage } from '@/components/ComingSoon'

export default function MyPage() {
  return (
    <ComingSoonPage 
      title="Feature Name"
      description="This feature is under development and will be available soon."
    />
  )
}
```

### 3. `ComingSoonButton` - Pre-configured Button
A button component that automatically shows "Coming Soon" when clicked.

```tsx
import { ComingSoonButton } from '@/components/ComingSoon'

<ComingSoonButton variant="outline">
  Download Report
</ComingSoonButton>
```

### 4. `ComingSoonLink` - Pre-configured Link
A link component that shows "Coming Soon" instead of navigating.

```tsx
import { ComingSoonLink } from '@/components/ComingSoon'

<ComingSoonLink href="/advanced-features">
  Advanced Features
</ComingSoonLink>
```

### 5. `withComingSoon` - Higher-Order Component
A utility function to wrap any component with Coming Soon functionality.

```tsx
import { withComingSoon } from '@/components/ComingSoon'

const ComingSoonCard = withComingSoon(Card, "Card Feature", "This card feature is coming soon")

<ComingSoonCard>
  <CardContent>Some content</CardContent>
</ComingSoonCard>
```

## Usage Examples

### For Buttons in Existing Pages
```tsx
// Instead of this:
<Button onClick={() => router.push('/non-existent-page')}>
  Go to Feature
</Button>

// Use this:
<ComingSoon title="Feature Name">
  <Button>Go to Feature</Button>
</ComingSoon>
```

### For Navigation Links
```tsx
// Instead of this:
<Link href="/non-existent-page">
  <Button>Feature</Button>
</Link>

// Use this:
<ComingSoon>
  <Link href="/non-existent-page">
    <Button>Feature</Button>
  </Link>
</ComingSoon>
```

### For Entire Pages
```tsx
// In a page.tsx file:
export default function NonExistentPage() {
  return (
    <ComingSoonPage 
      title="Advanced Dashboard"
      description="This advanced dashboard with analytics and reporting will be available in the next update."
    />
  )
}
```

## Error Handling

The application also includes automatic error handling:

1. **404 Errors**: `src/app/not-found.tsx` - Shows Coming Soon for non-existent routes
2. **Runtime Errors**: `src/app/error.tsx` - Shows Coming Soon for runtime errors
3. **Catch-all Routes**: `src/app/[...slug]/page.tsx` - Catches any other non-existent pages

## Best Practices

1. **Use descriptive titles**: Make the title clear about what feature is coming
2. **Provide helpful descriptions**: Explain what the feature will do when available
3. **Be consistent**: Use the same styling and messaging across the app
4. **Don't overuse**: Only use for features that are actually planned
5. **Update regularly**: Remove Coming Soon components when features are implemented

## Styling

The Coming Soon components use a consistent design with:
- Blue gradient background
- Warning icon
- Animated pulse dots
- Clean card layout
- Responsive design

All styling is handled automatically - no additional CSS needed. 