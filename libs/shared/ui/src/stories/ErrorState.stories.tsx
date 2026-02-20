import type { Meta, StoryObj } from '@storybook/react';
import { ErrorState } from '../common/ErrorState';
import { Button } from '../ui/Button';

/**
 * The **ErrorState** component provides friendly error displays.
 * Use it when an operation fails to guide users toward recovery.
 *
 * All apps in the monorepo should import ErrorState from `@going-monorepo-clean/shared-ui`.
 */
const meta: Meta<typeof ErrorState> = {
  title: 'Common Components/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Error heading' },
    description: {
      control: 'text',
      description: 'Human-friendly error description',
    },
    error: {
      control: 'text',
      description: 'Technical error detail (shown in smaller text)',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Usage
\`\`\`tsx
import { ErrorState } from '@going-monorepo-clean/shared-ui';

<ErrorState
  title="Could not load rides"
  description="Something went wrong while fetching your rides."
  error={error}
  action={<Button onClick={retry}>Try Again</Button>}
/>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const GenericError: Story = {
  args: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    action: <Button variant="primary">Retry</Button>,
  },
};

export const NetworkError: Story = {
  args: {
    title: 'Connection failed',
    description:
      'Unable to reach the Going servers. Please check your internet connection.',
    error: 'Network request failed: ERR_NETWORK_CHANGED',
    action: <Button variant="primary">Try Again</Button>,
  },
};

export const PaymentError: Story = {
  args: {
    title: 'Payment failed',
    description:
      'We could not process your payment. Please update your payment method.',
    error: 'Card declined: insufficient_funds',
    action: <Button variant="primary">Update Payment</Button>,
  },
};

export const RideLoadError: Story = {
  args: {
    title: 'Could not load rides',
    description: 'Failed to retrieve your ride history. Your data is safe.',
    action: (
      <div className="flex gap-2">
        <Button variant="ghost">Go Back</Button>
        <Button variant="primary">Reload</Button>
      </div>
    ),
  },
};
