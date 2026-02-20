import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/Button';

/**
 * The **EmptyState** component guides users when there is no data to display.
 * Use it for empty lists, search results with no hits, and onboarding flows.
 *
 * All apps in the monorepo should import EmptyState from `@going-monorepo-clean/shared-ui`.
 */
const meta: Meta<typeof EmptyState> = {
  title: 'Common Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'text',
      description: 'Emoji or icon character to display',
    },
    title: { control: 'text', description: 'Main heading' },
    description: {
      control: 'text',
      description: 'Supporting description text',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Usage
\`\`\`tsx
import { EmptyState } from '@going-monorepo-clean/shared-ui';

<EmptyState
  icon="🚗"
  title="No rides yet"
  description="Book your first ride to get started!"
  action={<Button variant="primary">Book a Ride</Button>}
/>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoRides: Story = {
  args: {
    icon: '🚗',
    title: 'No rides yet',
    description:
      'You have not taken any rides. Book your first ride to get started!',
    action: <Button variant="primary">Book a Ride</Button>,
  },
};

export const NoSearchResults: Story = {
  args: {
    icon: '🔍',
    title: 'No results found',
    description:
      "Try adjusting your search or filters to find what you're looking for.",
    action: <Button variant="ghost">Clear Filters</Button>,
  },
};

export const NoPayments: Story = {
  args: {
    icon: '💳',
    title: 'No payments found',
    description:
      'Your payment history is empty. Payments will appear here after your first ride.',
  },
};

export const NoDrivers: Story = {
  args: {
    icon: '📭',
    title: 'No drivers available',
    description:
      'There are no drivers in your area right now. Please try again shortly.',
    action: <Button variant="secondary">Retry</Button>,
  },
};

export const NoNotifications: Story = {
  args: {
    icon: '🔔',
    title: 'All caught up!',
    description:
      'No new notifications. We will let you know when something comes up.',
  },
};
