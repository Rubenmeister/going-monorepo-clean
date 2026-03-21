import type { Meta, StoryObj } from '@storybook/react';
import { Input, Textarea, Select } from '../ui/Input';

/**
 * The **Input** family of components provides form controls.
 * Includes text input, textarea, and select dropdown.
 *
 * All apps in the monorepo should import Input from `@going-monorepo-clean/shared-ui`.
 */
const meta: Meta<typeof Input> = {
  title: 'UI Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    error: { control: 'text', description: 'Error message (turns field red)' },
    helperText: { control: 'text', description: 'Helper text below the field' },
    disabled: { control: 'boolean', description: 'Disables the field' },
    required: { control: 'boolean', description: 'Marks field as required' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## Usage
\`\`\`tsx
import { Input, Textarea, Select } from '@going-monorepo-clean/shared-ui';

<Input
  label="Pickup Location"
  placeholder="Enter pickup address..."
  helperText="We'll use this to find nearby drivers"
/>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { label: 'Pickup Location', placeholder: 'Enter address...' },
};

export const WithHelperText: Story = {
  args: {
    label: 'Phone Number',
    placeholder: '+1 (555) 000-0000',
    helperText: 'We use this to contact you about your ride.',
    type: 'tel',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'driver@going.app',
    error: 'Please enter a valid email address.',
    type: 'email',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Driver ID',
    value: 'DRV-00142',
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Password',
    type: 'password',
    required: true,
    placeholder: '••••••••',
  },
};

export const TextareaStory: StoryObj<typeof Textarea> = {
  name: 'Textarea',
  render: () => (
    <Textarea
      label="Trip Notes"
      placeholder="Special instructions for the driver..."
      helperText="Optional. Max 250 characters."
      rows={4}
    />
  ),
};

export const SelectStory: StoryObj<typeof Select> = {
  name: 'Select',
  render: () => (
    <Select
      label="Vehicle Type"
      options={[
        { value: '', label: 'Choose a vehicle type' },
        { value: 'economy', label: 'Economy' },
        { value: 'comfort', label: 'Comfort' },
        { value: 'xl', label: 'XL (6 seats)' },
        { value: 'executive', label: 'Executive' },
      ]}
      helperText="Price varies by vehicle type."
    />
  ),
};

export const FormGroup: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input label="Full Name" placeholder="John Doe" required />
      <Input
        label="Email"
        type="email"
        placeholder="john@example.com"
        required
      />
      <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" />
      <Textarea label="Notes" placeholder="Anything we should know?" rows={3} />
      <Select
        label="City"
        options={[
          { value: '', label: 'Select city' },
          { value: 'ny', label: 'New York' },
          { value: 'la', label: 'Los Angeles' },
          { value: 'ch', label: 'Chicago' },
        ]}
      />
    </div>
  ),
};
