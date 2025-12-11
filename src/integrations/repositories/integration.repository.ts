import { Injectable } from '@nestjs/common';
import { Integration } from 'src/generated/prisma/browser';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
// import { Integration, Prisma } from '@prisma/client';

@Injectable()
export class IntegrationRepository {
  constructor(private prisma: PrismaService) {}

  async upsert(data: {
    userId: string;
    provider: string;
    providerUserId: string;
    accessToken: string;
    refreshToken?: string;
    accessTokenExpiresAt: Date;
    metadata?: Record<string, any>;
  }): Promise<Integration> {
    return this.prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: data.userId,
          provider: data.provider,
        },
      },
      update: {
        providerUserId: data.providerUserId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpiresAt: data.accessTokenExpiresAt,
        metadata: data.metadata,
        isActive: true,
      },
      create: {
        userId: data.userId,
        provider: data.provider,
        providerUserId: data.providerUserId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpiresAt: data.accessTokenExpiresAt,
        metadata: data.metadata,
      },
    });
  }

  async findById(id: string): Promise<Integration | null> {
    return this.prisma.integration.findUnique({
      where: { id },
    });
  }

  async findByUserAndProvider(
    userId: string,
    provider: string,
  ): Promise<Integration | null> {
    return this.prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }

  async findByUser(userId: string): Promise<Integration[]> {
    return this.prisma.integration.findMany({
      where: { userId },
    });
  }

  async update(
    id: string,
    data: Prisma.IntegrationUpdateInput,
  ): Promise<Integration> {
    return this.prisma.integration.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Integration> {
    return this.prisma.integration.delete({
      where: { id },
    });
  }

  async toggleActive(id: string, isActive: boolean): Promise<Integration> {
    return this.prisma.integration.update({
      where: { id },
      data: { isActive },
    });
  }
}
