/**
 * Going Monorepo Clean - Shared UI Component Library
 *
 * This library exports all reusable UI components used across the monorepo.
 * It includes both presentational UI components (Button, Card, Input, etc.)
 * and common utility components (Loading, EmptyState, ErrorState).
 *
 * All components are built with Tailwind CSS and TypeScript for type safety.
 *
 * @example
 * import {
 *   Button, Card, CardBody, Input, Alert, Badge, Modal,
 *   Loading, EmptyState, ErrorState
 * } from '@going-monorepo-clean/shared-ui';
 *
 * // Use components
 * <Button variant="primary" onClick={handleClick}>Click me</Button>
 * <Card><CardBody>Content</CardBody></Card>
 * <Loading size="md" message="Loading..." />
 */

// UI Components
export {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Select,
  Alert,
  Badge,
  Modal,
  ModalFooter,
} from './ui';

// Common Components
export { Loading, EmptyState, ErrorState } from './common';
