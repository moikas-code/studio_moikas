# Studio Moikas Storybook

This project uses Storybook for component development and documentation.

## Getting Started

To run Storybook locally:

```bash
bun run storybook
```

To build Storybook for production:

```bash
bun run build-storybook
```

## Structure

Stories are organized by feature area:

- **Common** - Shared UI components (buttons, cards, displays)
- **Image** - Image generation and editing components
- **Audio** - Audio playback and recording components
- **MEMU** - Workflow and chat components
- **Video** - Video effects and processing components

## Features

### Addons

- **Controls** - Dynamically interact with component props
- **Actions** - Log actions as users interact with components
- **Viewport** - Test responsive designs
- **A11y** - Accessibility testing
- **Docs** - Auto-generated documentation

### Themes

Storybook is configured with dark and light themes that match the app design. The dark theme is set as default.

### Global Decorators

- **Theme Provider** - Provides DaisyUI theme switching
- **Clerk Provider** - Mocks authentication for testing
- **MpContext Provider** - Provides token balance context

## Writing Stories

Basic story structure:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { YourComponent } from '@/components/YourComponent'

const meta = {
  title: 'Category/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered', // or 'fullscreen', 'padded'
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls for props
  },
} satisfies Meta<typeof YourComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    // Default props
  },
}
```

## Best Practices

1. **Organize by Feature** - Group related components together
2. **Document Props** - Use argTypes to document all props
3. **Show States** - Create stories for loading, error, and empty states
4. **Test Responsiveness** - Add mobile/tablet viewport stories
5. **Include Actions** - Log user interactions for interactive components

## Tips

- Use the controls panel to dynamically change props
- Test accessibility with the a11y addon
- Check responsive design with viewport addon
- Document complex components with MDX stories