import { Module } from '@nestjs/common';
import { OAuthService } from './oauth/oauth.service';
import { OAuthController } from './oauth/oauth.controller';
import { IntegrationRepository } from './repositories/integration.repository';
import { ContaAzulProvider } from './providers/conta-azul/conta-azul.provider';

@Module({
  controllers: [OAuthController],
  providers: [OAuthService, IntegrationRepository, ContaAzulProvider],
  exports: [OAuthService, IntegrationRepository],
})
export class IntegrationsModule {}
