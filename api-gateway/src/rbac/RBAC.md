# Role-Based Access Control (RBAC) System

## Overview

The RBAC system provides fine-grained access control for API Gateway routes. It consists of:

1. **Roles**: User roles in the system (admin, host, driver, user)
2. **Permissions**: Fine-grained permissions tied to resources (e.g., `bookings.write`)
3. **Decorators**: `@Roles()` and `@Permissions()` to mark protected routes
4. **Guards**: `RolesGuard` and `PermissionsGuard` to enforce access control

## Hierarchy

```
Role (100)     Admin     - Full system access
Role (75)      Host      - Accommodation/experience management
Role (50)      Driver    - Transportation/tracking
Role (10)      User      - Regular user features
```

## Permissions Matrix

### Booking Service
- `bookings.read` - View bookings
- `bookings.write` - Create/update bookings
- `bookings.cancel` - Cancel bookings
- `bookings.confirm` - Confirm bookings (host-only)

### Accommodation Service
- `accommodations.read` - View accommodations
- `accommodations.write` - Create/edit accommodations
- `accommodations.publish` - Publish accommodations
- `accommodations.delete` - Delete accommodations

### Admin Panel
- `admin.settings` - Change system settings
- `admin.users` - Manage users
- `admin.analytics` - View analytics

## Usage

### 1. Basic Role-Based Access

```typescript
@Controller('bookings')
export class BookingController {
  // Only users and hosts can list bookings
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'host', 'admin')
  async listBookings() {
    return { message: 'Bookings' };
  }

  // Only admins can delete all bookings
  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteAllBookings() {
    return { message: 'Deleted' };
  }
}
```

### 2. Permission-Based Access

```typescript
@Controller('bookings')
export class BookingController {
  // Anyone with 'bookings.write' permission can create
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('bookings.write')
  async createBooking(@Body() dto: CreateBookingDto) {
    return { message: 'Created' };
  }

  // Specific permission for cancellation
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('bookings.cancel')
  async cancelBooking(@Param('id') id: string) {
    return { message: 'Cancelled' };
  }
}
```

### 3. Combined Role + Permission

```typescript
@Controller('admin')
export class AdminController {
  // Both role AND permission required (AND logic)
  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin')
  @Permissions('admin.users')
  async createUser(@Body() dto: CreateUserDto) {
    return { message: 'User created' };
  }
}
```

### 4. Multiple Roles (OR Logic)

```typescript
@Controller('accommodations')
export class AccommodationController {
  // Only hosts and admins can publish
  // User OR admin can view
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'host', 'admin')
  async list() {
    return { message: 'List' };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin') // Only host or admin
  async create() {
    return { message: 'Created' };
  }
}
```

### 5. Multiple Permissions (ALL required)

```typescript
@Controller('admin')
export class AdminController {
  // ALL permissions required (AND logic)
  @Post('critical-update')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('admin.users', 'admin.settings')
  async criticalUpdate() {
    return { message: 'Updated' };
  }
}
```

## Guard Usage

### JwtAuthGuard

Validates JWT token and checks if it's revoked.

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile() {
  return { message: 'User profile' };
}
```

Returns 401 if:
- Token is missing
- Token is invalid/expired
- Token is revoked (blacklisted)

### RolesGuard

Checks if user has required role(s).

```typescript
@Post('admin-action')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async adminAction() {
  return { message: 'Admin action' };
}
```

Returns 403 if user doesn't have required role.

### PermissionsGuard

Checks if user has required permission(s).

```typescript
@Patch('booking')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('bookings.write')
async updateBooking() {
  return { message: 'Updated' };
}
```

Returns 403 if user doesn't have required permission.

## Token Structure

Access tokens contain:

```json
{
  "sub": "user-uuid",
  "userId": "user-uuid",
  "email": "user@example.com",
  "roles": ["user", "host"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

The token is automatically validated by:

1. **JWT Strategy**: Validates signature and checks blacklist
2. **JwtAuthGuard**: Ensures token is present and valid
3. **RolesGuard**: Checks if user's roles are in required list
4. **PermissionsGuard**: Checks if user has required permissions

## Best Practices

### 1. Use Specific Permissions

❌ Bad: `@Permissions('bookings.write')` for everything
✅ Good: Use specific permissions like `bookings.create`, `bookings.update`, `bookings.cancel`

### 2. Combine Guards

❌ Bad: Only using `@Roles()`
✅ Good: Use `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)` for comprehensive protection

### 3. Role + Permission

❌ Bad: Only checking role
✅ Good: Check role for category (admin), permission for specifics (admin.users)

### 4. Fail-Secure

All guards fail closed (deny by default). If no @Roles or @Permissions decorator is present, the route is public (but still requires JwtAuthGuard if used).

### 5. Guard Order

```typescript
// Correct order:
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
// JwtAuthGuard first (validates token)
// RolesGuard next (checks roles)
// PermissionsGuard last (checks permissions)
```

## Implementation Details

### Adding New Permissions

1. Add to `PermissionType` in `libs/shared/domain/src/lib/value-objects/permission.vo.ts`
2. Add to role's permission array in `ROLE_HIERARCHY`
3. Use `@Permissions()` decorator on routes

### Adding New Roles

1. Add to `RoleType` in `role.vo.ts`
2. Add to `ROLE_HIERARCHY` with permissions
3. Use `@Roles()` decorator on routes

### Custom Permission Logic

For complex permission checks, use `RbacService`:

```typescript
constructor(private rbacService: RbacService) {}

async complexCheck(userId: string, resource: string, action: string) {
  return this.rbacService.canAccessResource(
    ['user', 'host'],
    resource,
    action
  );
}
```

## Testing

### Test Protected Route

```typescript
it('should deny access without token', async () => {
  const response = await request(app.getHttpServer())
    .get('/bookings')
    .expect(401);
});

it('should allow with valid role', async () => {
  const token = jwt.sign(
    { sub: '123', roles: ['user'] },
    'secret'
  );

  const response = await request(app.getHttpServer())
    .get('/bookings')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});

it('should deny with insufficient role', async () => {
  const token = jwt.sign(
    { sub: '123', roles: ['user'] },
    'secret'
  );

  const response = await request(app.getHttpServer())
    .post('/admin/users')
    .set('Authorization', `Bearer ${token}`)
    .expect(403);
});
```

## Examples by Module

### Booking Module
- List: `bookings.read`
- Create: `bookings.write`
- Cancel: `bookings.cancel`
- Confirm: `bookings.confirm` (host)

### Accommodation Module
- View: `accommodations.read`
- Create: `accommodations.write` (host)
- Publish: `accommodations.publish` (host)
- Delete: `accommodations.delete` (admin)

### Admin Panel
- User Management: `@Roles('admin')` + `admin.users`
- Settings: `@Roles('admin')` + `admin.settings`
- Analytics: `@Roles('admin')` + `admin.analytics`

## Security Notes

1. **Token Blacklist**: Tokens are checked against a blacklist for revocation
2. **Timing-Safe Comparison**: Signatures use timing-safe comparison to prevent timing attacks
3. **Fail-Secure**: All checks fail closed (deny by default)
4. **No Hardcoding**: Permissions are defined in a central matrix
5. **Audit Logging**: All access control decisions are logged

## Troubleshooting

### "Missing required role"
- Check that decorator is applied: `@Roles('user')`
- Check guard is applied: `@UseGuards(RolesGuard)`
- Check token contains roles claim

### "Access denied: Invalid permission"
- Verify permission exists in `ROLE_HIERARCHY`
- Check spelling: `'bookings.write'` not `'bookings.writes'`
- Verify role includes permission

### "401 Unauthorized"
- Token missing: Add to Authorization header `Bearer <token>`
- Token expired: Request new token via refresh endpoint
- Token revoked: User was logged out or account locked

## References

- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
