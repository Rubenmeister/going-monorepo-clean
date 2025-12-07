import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { User, IUserRepository, RoleType } from '@going-monorepo-clean/domains-user-core';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<Result<void, Error>> {
    try {
      const primitives = user.toPrimitives();
      await this.prisma.user.create({
        data: {
          id: primitives.id,
          email: primitives.email,
          passwordHash: primitives.passwordHash,
          name: primitives.name,
          role: primitives.role, // Enum matches
          isActive: primitives.isActive,
          createdAt: primitives.createdAt,
          updatedAt: primitives.updatedAt,
        },
      });
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save user: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<User | null, Error>> {
    try {
      const record = await this.prisma.user.findUnique({ where: { id } });
      return ok(record ? this.toDomain(record) : null);
    } catch (error) {
      return err(new Error(`Failed to find user by id: ${error.message}`));
    }
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const record = await this.prisma.user.findUnique({ where: { email } });
      return ok(record ? this.toDomain(record) : null);
    } catch (error) {
      return err(new Error(`Failed to find user by email: ${error.message}`));
    }
  }

  private toDomain(record: any): User {
    // Ensure role matches key in RoleType Enum
    const roleKey = record.role as keyof typeof RoleType; 
    
    return User.fromPrimitives({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      name: record.name,
      role: RoleType[roleKey],
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
