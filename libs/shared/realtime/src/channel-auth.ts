/**
 * Channel Authorization
 * Validates if a user can subscribe to a channel
 */

import { Channel, ChannelType, parseChannel, SubscriptionRequest, SubscriptionResult } from './types';
import { Role, RoleUser, isInRoleGroup, hasTenantAccess } from '@going/shared/permissions';

// Channel access rules by role
const CHANNEL_ACCESS: Record<ChannelType, Role[]> = {
  fleet: ['driver', 'ops_support', 'ops_supervisor', 'ops_admin', 'super_admin'],
  tour: ['customer', 'provider', 'ops_support', 'ops_supervisor', 'ops_admin', 'super_admin'],
  trip: ['customer', 'driver', 'ops_support', 'ops_supervisor', 'ops_admin', 'super_admin'],
  shipment: ['customer', 'driver', 'ops_support', 'ops_supervisor', 'ops_admin', 'enterprise_user', 'enterprise_admin', 'super_admin'],
  company: ['enterprise_user', 'enterprise_admin', 'ops_admin', 'super_admin'],
  driver: ['driver', 'ops_support', 'ops_supervisor', 'ops_admin', 'super_admin'],
  user: ['customer', 'provider', 'driver', 'enterprise_user', 'enterprise_admin', 'ops_support', 'ops_supervisor', 'ops_admin', 'super_admin'],
};

/**
 * Validate if a user can subscribe to a channel
 */
export function canSubscribe(
  user: RoleUser | null,
  channelString: string,
  context?: { resourceOwnerId?: string; resourceTenantId?: string }
): SubscriptionResult {
  // No user = no access
  if (!user) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // Parse channel
  const channel = parseChannel(channelString);
  if (!channel) {
    return { allowed: false, reason: 'Invalid channel format' };
  }

  // Super admin can subscribe to anything
  if (user.role === 'super_admin') {
    return { allowed: true };
  }

  // Check role access
  const allowedRoles = CHANNEL_ACCESS[channel.type];
  if (!allowedRoles.includes(user.role)) {
    return { allowed: false, reason: `Role '${user.role}' cannot access '${channel.type}' channels` };
  }

  // Special validation based on channel type
  switch (channel.type) {
    case 'user':
      // Users can only subscribe to their own channel
      if (channel.id !== user.id && !isOpsOrAdmin(user.role)) {
        return { allowed: false, reason: 'Can only subscribe to own user channel' };
      }
      break;

    case 'driver':
      // Drivers can only subscribe to their own channel
      if (user.role === 'driver' && channel.id !== user.id) {
        return { allowed: false, reason: 'Drivers can only subscribe to own channel' };
      }
      break;

    case 'company':
      // Enterprise users can only subscribe to their tenant
      if (!hasTenantAccess(user, channel.id)) {
        return { allowed: false, reason: 'No access to this company channel' };
      }
      break;

    case 'trip':
    case 'shipment':
      // Customers can only subscribe to their own trips/shipments
      if (user.role === 'customer' && context?.resourceOwnerId && context.resourceOwnerId !== user.id) {
        return { allowed: false, reason: 'Can only subscribe to own resources' };
      }
      // Enterprise users can only access tenant resources
      if (isEnterpriseRole(user.role) && context?.resourceTenantId && !hasTenantAccess(user, context.resourceTenantId)) {
        return { allowed: false, reason: 'Resource not in your tenant' };
      }
      break;
  }

  return { allowed: true };
}

// Helper: check if role is ops or admin
function isOpsOrAdmin(role: Role): boolean {
  return ['ops_support', 'ops_supervisor', 'ops_admin', 'super_admin'].includes(role);
}

// Helper: check if role is enterprise
function isEnterpriseRole(role: Role): boolean {
  return ['enterprise_user', 'enterprise_admin'].includes(role);
}

/**
 * Get allowed channels for a user
 */
export function getAllowedChannelTypes(user: RoleUser | null): ChannelType[] {
  if (!user) return [];
  
  if (user.role === 'super_admin') {
    return Object.keys(CHANNEL_ACCESS) as ChannelType[];
  }

  return (Object.entries(CHANNEL_ACCESS) as [ChannelType, Role[]][])
    .filter(([_, roles]) => roles.includes(user.role))
    .map(([type]) => type);
}
