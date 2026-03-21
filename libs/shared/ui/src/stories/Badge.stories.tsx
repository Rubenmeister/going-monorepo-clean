import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../ui/Badge';

/**
 * The **Badge** component displays status labels and tags.
 * It comes in 6 semantic variants and 3 sizes.
 *
 * All apps in the monorepo should import Badge from `@going-monorepo-clean/shared-ui`.
 */
const meta: Meta<typeof Badge> = {
  title: 'UI Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'info'],
      description: 'The semantic color variant',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size',
      table: { defaultValue: { summary: 'md' } },
    },
    children: {
      control: 'text',
      description: 'Badge label',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Usage
\`\`\`tsx
import { Badge } from '@going-monorepo-clean/shared-ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning">In Transit</Badge>
<Badge variant="error">Cancelled</Badge>
\`\`\`

## Variants
- **primary** — Default, branded
- **secondary** — Neutral
- **success** — Active, completed, online
- **warning** — Pending, in progress, surging
- **error** — Cancelled, failed, offline
- **info** — Informational labels
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Primary: Story = { args: { variant: 'primary', children: 'New' } };
export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Draft' },
};
export const Success: Story = {
  args: { variant: 'success', children: 'Active' },
};
export const Warning: Story = {
  args: { variant: 'warning', children: 'Pending' },
};
export const Error: Story = {
  args: { variant: 'error', children: 'Cancelled' },
};
export const Info: Story = { args: { variant: 'info', children: 'In Review' } };

export const RideStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary">Requested</Badge>
      <Badge variant="info">Driver Assigned</Badge>
      <Badge variant="warning">En Route</Badge>
      <Badge variant="success">Completed</Badge>
      <Badge variant="error">Cancelled</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge variant="success" size="sm">
        Small
      </Badge>
      <Badge variant="success" size="md">
        Medium
      </Badge>
      <Badge variant="success" size="lg">
        Large
      </Badge>
    </div>
  ),
};
