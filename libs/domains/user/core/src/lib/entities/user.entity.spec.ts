import { User, RoleType } from './user.entity';

describe('User Entity', () => {
  const defaultProps = {
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    name: 'Test User',
  };

  it('should create a user with default USER role', () => {
    const userResult = User.create(defaultProps);
    expect(userResult.isOk()).toBe(true);
    const user = userResult._unsafeUnwrap();
    expect(user.role).toBe(RoleType.USER);
    expect(user.isActive).toBe(true);
    expect(user.id).toBeDefined();
  });

  it('should create a user with specified role', () => {
    const userResult = User.create({ ...defaultProps, role: RoleType.ADMIN });
    const user = userResult._unsafeUnwrap();
    expect(user.role).toBe(RoleType.ADMIN);
  });

  it('should return error if name is too short', () => {
    const userResult = User.create({ ...defaultProps, name: 'A' });
    expect(userResult.isErr()).toBe(true);
    expect(userResult._unsafeUnwrapErr().message).toBe('Name is too short');
  });

  it('should return error if email is invalid', () => {
    const userResult = User.create({ ...defaultProps, email: 'invalid-email' });
    expect(userResult.isErr()).toBe(true);
    expect(userResult._unsafeUnwrapErr().message).toBe('Invalid email');
  });

  it('should restore from primitives', () => {
    const now = new Date();
    const props = {
      id: 'uuid-1',
      email: 'test@example.com',
      passwordHash: 'hash',
      name: 'Test',
      role: RoleType.HOST,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const user = User.fromPrimitives(props);
    expect(user.id).toBe('uuid-1');
    expect(user.role).toBe(RoleType.HOST);
    expect(user.createdAt).toEqual(now);
  });
});