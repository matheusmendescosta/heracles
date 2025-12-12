import { Module } from '@nestjs/common';
import { OAuthService } from './oauth/oauth.service';
import { OAuthController } from './oauth/oauth.controller';
import { IntegrationRepository } from './repositories/integration.repository';
import { ContaAzulProvider } from './providers/conta-azul/conta-azul.provider';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PrismaService, OAuthService, IntegrationRepository, ContaAzulProvider],
  controllers: [OAuthController],
  exports: [OAuthService, IntegrationRepository, PrismaService],
})
export class IntegrationsModule {}
