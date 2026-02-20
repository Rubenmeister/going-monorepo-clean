import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../ui/Alert';

/**
 * The **Alert** component displays contextual notifications.
 * It comes in 4 types and supports closeable dismissal.
 *
 * All apps in the monorepo should import Alert from `@going-monorepo-clean/shared-ui`.
 */
const meta: Meta<typeof Alert> = {
  title: 'UI Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'radio',
      options: ['success', 'error', 'warning', 'info'],
      description: 'The type of alert message',
      table: { defaultValue: { summary: 'info' } },
    },
    title: {
      control: 'text',
      description: 'Optional bold title above the message',
    },
    closeable: {
      control: 'boolean',
      description: 'Shows a close (×) button to dismiss the alert',
    },
    children: {
      control: 'text',
      description: 'The alert message content',
    },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## Usage
\`\`\`tsx
import { Alert } from '@going-monorepo-clean/shared-ui';

<Alert type="success" title="Ride Booked!" closeable>
  Your ride has been confirmed. Driver is on the way.
</Alert>
\`\`\`

## Types
- **success** — Positive outcome, completion
- **error** — Failure, critical issues
- **warning** — Caution, non-blocking issues
- **info** — Neutral informational messages
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Ride Booked!',
    children: 'Your ride has been confirmed. Driver is on the way.',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Payment Failed',
    children:
      'We could not process your payment. Please check your card details.',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Surge Pricing Active',
    children:
      'Prices are 1.8x higher than usual due to high demand in your area.',
  },
};

export const Info: Story = {
  args: {
    type: 'info',
    children: 'Your driver will arrive in approximately 5 minutes.',
  },
};

export const Closeable: Story = {
  args: {
    type: 'success',
    title: 'Driver Assigned',
    children: 'Ahmed K. is en route. ETA: 4 minutes.',
    closeable: true,
  },
};

export const WithoutTitle: Story = {
  args: {
    type: 'info',
    children: 'Please ensure your pickup location is accurate.',
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-lg">
      <Alert type="success" title="Success">
        Ride completed successfully!
      </Alert>
      <Alert type="error" title="Error">
        Driver could not be found.
      </Alert>
      <Alert type="warning" title="Warning">
        High traffic in your area.
      </Alert>
      <Alert type="info" title="Info">
        Tap to track your driver in real time.
      </Alert>
    </div>
  ),
};
