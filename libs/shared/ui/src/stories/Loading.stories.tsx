import type { Meta, StoryObj } from '@storybook/react';
import { Loading } from '../common/Loading';

/**
 * The **Loading** component displays a spinner for async states.
 * Supports multiple sizes and optional messages.
 *
 * All apps in the monorepo should import Loading from `@going-monorepo-clean/shared-ui`.
 */
const meta: Meta<typeof Loading> = {
  title: 'Common Components/Loading',
  component: Loading,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Spinner size',
      table: { defaultValue: { summary: 'md' } },
    },
    message: {
      control: 'text',
      description: 'Optional loading message',
    },
    fullHeight: {
      control: 'boolean',
      description: 'Fills the full parent height',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Usage
\`\`\`tsx
import { Loading } from '@going-monorepo-clean/shared-ui';

// Simple spinner
<Loading size="md" />

// With message
<Loading size="lg" message="Finding your driver..." />

// Full height (for page-level loading)
<Loading fullHeight message="Loading bookings..." />
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const Default: Story = { args: { size: 'md' } };

export const WithMessage: Story = {
  args: { size: 'md', message: 'Finding your driver...' },
};

export const Small: Story = { args: { size: 'sm', message: 'Loading...' } };
export const Large: Story = {
  args: { size: 'lg', message: 'Processing payment...' },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <Loading size="sm" message="Small" />
      <Loading size="md" message="Medium" />
      <Loading size="lg" message="Large" />
    </div>
  ),
};
