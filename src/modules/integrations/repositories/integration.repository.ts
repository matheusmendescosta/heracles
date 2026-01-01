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

  /**
   * Encontra integrações ativas que expiram em X minutos
   * Utilizado pelo TokenRefreshService para renovação proativa de tokens
   * @param minutesUntilExpiry Minutos até a expiração (ex: 5 para 5 minutos)
   * @returns Lista de integrações que expiram em breve
   */
  async findExpiringTokens(minutesUntilExpiry: number): Promise<Integration[]> {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + minutesUntilExpiry * 60000);

    return this.prisma.integration.findMany({
      where: {
        isActive: true,
        accessTokenExpiresAt: {
          lte: expiryThreshold, // Expira no máximo em 5 minutos
          gte: now,             // Mas ainda NÃO expirou
        },
        refreshToken: {
          not: null, // Apenas integrações com refresh token
        },
      },
      orderBy: {
        accessTokenExpiresAt: 'asc',
      },
    });
  }

  /**
   * Debug: Busca TODAS as integrações ativas com seus tokens
   * Útil para investigar por que nenhum token está expirando
   */
  async findAllActiveIntegrations(): Promise<
    Array<{
      id: string;
      provider: string;
      userId: string;
      accessTokenExpiresAt: Date;
      refreshToken: string | null;
      isActive: boolean;
      createdAt: Date;
    }>
  > {
    return this.prisma.integration.findMany({
      where: {
        isActive: true,
        refreshToken: {
          not: null,
        },
      },
      select: {
        id: true,
        provider: true,
        userId: true,
        accessTokenExpiresAt: true,
        refreshToken: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        accessTokenExpiresAt: 'asc',
      },
    });
  }

  /**
   * Remove integrações inativas criadas antes de uma data específica
   * Utilizado para limpeza periódica de dados obsoletos
   * @param beforeDate Data limite para remoção
   * @returns Quantidade de registros removidos
   */
  async deleteInactiveOlderThan(beforeDate: Date): Promise<{ count: number }> {
    return this.prisma.integration.deleteMany({
      where: {
        isActive: false,
        createdAt: {
          lt: beforeDate,
        },
      },
    });
  }
}
