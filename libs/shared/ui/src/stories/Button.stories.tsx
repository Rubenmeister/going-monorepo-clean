import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../ui/Button';

/**
 * The **Button** component is the foundational interactive element.
 * It comes in 5 variants and 3 sizes, with loading and disabled states.
 *
 * All apps in the monorepo should import Button from `@going-monorepo-clean/shared-ui`.
 */
const meta: Meta<typeof Button> = {
  title: 'UI Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'success', 'ghost'],
      description: 'The visual variant of the button',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
      table: { defaultValue: { summary: 'md' } },
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows a loading spinner and disables the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes the button take full container width',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    children: {
      control: 'text',
      description: 'Button label content',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Usage
\`\`\`tsx
import { Button } from '@going-monorepo-clean/shared-ui';

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
\`\`\`

## Variants
- **primary** — Main CTA, high emphasis actions
- **secondary** — Secondary actions, medium emphasis
- **danger** — Destructive or irreversible actions
- **success** — Confirmation or completion actions
- **ghost** — Low emphasis, tertiary actions
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Book a Ride' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'View Details' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Cancel Ride' },
};

export const Success: Story = {
  args: { variant: 'success', children: 'Confirm Booking' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Learn More' },
};

export const Small: Story = {
  args: { variant: 'primary', size: 'sm', children: 'Small Button' },
};

export const Large: Story = {
  args: { variant: 'primary', size: 'lg', children: 'Large Button' },
};

export const Loading: Story = {
  args: { variant: 'primary', isLoading: true, children: 'Processing...' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'Unavailable' },
};

export const FullWidth: Story = {
  args: { variant: 'primary', fullWidth: true, children: 'Full Width Action' },
  parameters: { layout: 'padded' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
