import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

/**
 * The **Modal** component is a dialog overlay for focused user tasks.
 * Supports keyboard (Escape) and backdrop click to close.
 *
 * All apps in the monorepo should import Modal from `@going-monorepo-clean/shared-ui`.
 */
const meta: Meta<typeof Modal> = {
  title: 'UI Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Usage
\`\`\`tsx
import { Modal, ModalFooter } from '@going-monorepo-clean/shared-ui';

const [isOpen, setIsOpen] = useState(false);

<Button onClick={() => setIsOpen(true)}>Open Modal</Button>

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Booking">
  Are you sure you want to book this ride?
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const ConfirmAction: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Cancel Ride
        </Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Cancel Ride">
          <p className="text-gray-600">
            Are you sure you want to cancel your ride? A cancellation fee may
            apply.
          </p>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep Ride
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Yes, Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

export const WithAlert: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Book Ride
        </Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Confirm Booking"
        >
          <Alert type="info">
            Your card ending in 4242 will be charged upon completion.
          </Alert>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Distance</span>
              <span>12.3 km</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated time</span>
              <span>~18 min</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900">
              <span>Estimated fare</span>
              <span>$24.50</span>
            </div>
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm Ride
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

export const DefaultOpen: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Modal Title',
    children: 'This is the modal content. You can put anything here.',
  },
};
