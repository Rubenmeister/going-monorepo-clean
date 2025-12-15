import { Injectable } from '@nestjs/common';
import { IUserRepository, User } from '@going-monorepo-clean/domains-user-core';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
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
          role: primitives.role,
          isActive: primitives.isActive ?? true,
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save user: ${error.message}`));
    }
  }

  async update(user: User): Promise<Result<void, Error>> {
    try {
      const primitives = user.toPrimitives();
      
      await this.prisma.user.update({
        where: { id: primitives.id },
        data: {
          email: primitives.email,
          passwordHash: primitives.passwordHash,
          name: primitives.name,
          role: primitives.role,
          isActive: primitives.isActive,
          updatedAt: new Date(),
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update user: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<User | null, Error>> {
    try {
      const prismaUser = await this.prisma.user.findUnique({ where: { id } });
      
      if (!prismaUser) {
        return ok(null);
      }

      return ok(this.toDomain(prismaUser));
    } catch (error) {
      return err(new Error(`Failed to find user by id: ${error.message}`));
    }
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const prismaUser = await this.prisma.user.findUnique({ where: { email } });
      
      if (!prismaUser) {
        return ok(null);
      }

      return ok(this.toDomain(prismaUser));
    } catch (error) {
      return err(new Error(`Failed to find user by email: ${error.message}`));
    }
  }

  async findByVerificationToken(token: string): Promise<Result<User | null, Error>> {
    try {
      // Note: verificationToken field would need to be added to Prisma schema
      // For now, return null as verification tokens are not yet implemented
      return ok(null);
    } catch (error) {
      return err(new Error(`Failed to find user by verification token: ${error.message}`));
    }
  }

  private toDomain(prismaUser: any): User {
    return User.fromPrimitives({
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      name: prismaUser.name,
      role: prismaUser.role,
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }
}