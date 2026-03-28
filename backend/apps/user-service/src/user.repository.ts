import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma-user/client';
import { getUserPrismaClient } from './user-prisma-client';

@Injectable()
export class UserRepository {
  public async findUserById(userId: string): Promise<UserRow | null> {
    const prisma = getUserPrismaClient();
    return prisma.user.findUnique({ where: { id: userId } });
  }
  public async createUser(input: {
    readonly phone: string;
    readonly email: string | null;
    readonly fullName: string;
    readonly passwordHash: string;
  }): Promise<UserRow> {
    const prisma = getUserPrismaClient();
    return prisma.user.create({
      data: {
        phone: input.phone,
        email: input.email,
        fullName: input.fullName,
        passwordHash: input.passwordHash,
      },
    });
  }
  public async findUserByEmail(email: string): Promise<UserRow | null> {
    const prisma = getUserPrismaClient();
    return prisma.user.findUnique({ where: { email } });
  }
  public async findUserByPhone(phone: string): Promise<UserRow | null> {
    const prisma = getUserPrismaClient();
    return prisma.user.findUnique({ where: { phone } });
  }
  public async updateUser(input: {
    readonly userId: string;
    readonly data: Prisma.UserUpdateInput;
  }): Promise<UserRow> {
    const prisma = getUserPrismaClient();
    return prisma.user.update({
      where: { id: input.userId },
      data: input.data,
    });
  }
}

type UserRow = {
  readonly id: string;
  readonly email: string | null;
  readonly phone: string;
  readonly fullName: string;
  readonly passwordHash: string;
  readonly addresses: Prisma.JsonValue;
};
