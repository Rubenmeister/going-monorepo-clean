import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

/**
 * The **Card** component is a container for grouped content.
 * It provides optional header, body, and footer sections.
 *
 * All apps in the monorepo should import Card from `@going-monorepo-clean/shared-ui`.
 */
const meta: Meta<typeof Card> = {
  title: 'UI Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    shadow: {
      control: 'radio',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Shadow depth of the card',
    },
    padding: {
      control: 'radio',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding of the card',
    },
    border: {
      control: 'boolean',
      description: 'Whether to show a border',
    },
    rounded: {
      control: 'radio',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Border radius size',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Usage
\`\`\`tsx
import { Card, CardHeader, CardBody, CardFooter } from '@going-monorepo-clean/shared-ui';

<Card shadow="md">
  <CardHeader>Trip Summary</CardHeader>
  <CardBody>Content here</CardBody>
  <CardFooter>
    <Button>Book Again</Button>
  </CardFooter>
</Card>
\`\`\`

## Sub-components
- **CardHeader** — Top section, typically for titles and actions
- **CardBody** — Main content area
- **CardFooter** — Bottom section, typically for actions
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>Trip Summary</CardHeader>
      <CardBody>
        <p className="text-gray-600">
          Your ride from Downtown to Airport was completed successfully.
        </p>
        <p className="text-lg font-bold text-gray-900 mt-2">$24.50</p>
      </CardBody>
      <CardFooter>
        <Button variant="ghost" size="sm">
          View Receipt
        </Button>
        <Button variant="primary" size="sm">
          Book Again
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <span>Driver Profile</span>
          <Badge variant="success">Active</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
            JD
          </div>
          <div>
            <p className="font-semibold text-gray-900">John Driver</p>
            <p className="text-sm text-gray-500">★ 4.9 (1,234 trips)</p>
          </div>
        </div>
      </CardBody>
    </Card>
  ),
};

export const StatCard: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Card className="text-center">
        <CardBody>
          <p className="text-3xl font-bold text-blue-600">1,234</p>
          <p className="text-sm text-gray-500 mt-1">Total Rides</p>
        </CardBody>
      </Card>
      <Card className="text-center">
        <CardBody>
          <p className="text-3xl font-bold text-green-600">$8,450</p>
          <p className="text-sm text-gray-500 mt-1">Revenue</p>
        </CardBody>
      </Card>
      <Card className="text-center">
        <CardBody>
          <p className="text-3xl font-bold text-purple-600">98.2%</p>
          <p className="text-sm text-gray-500 mt-1">Satisfaction</p>
        </CardBody>
      </Card>
    </div>
  ),
  parameters: { layout: 'padded' },
};

export const BodyOnly: Story = {
  render: () => (
    <Card className="w-64">
      <CardBody>Simple card body content.</CardBody>
    </Card>
  ),
};
