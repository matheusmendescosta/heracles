import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/env';
import {
  OAuthProvider,
  OAuthToken,
} from './interfaces/oauth-provider.interface';
import { ContaAzulProvider } from '../providers/conta-azul/conta-azul.provider';
import { IntegrationRepository } from '../repositories/integration.repository';

@Injectable()
export class OAuthService {
  private providers: Map<string, OAuthProvider> = new Map();

  constructor(
    private configService: ConfigService<Env, true>,
    private integrationRepository: IntegrationRepository,
    private contaAzulProvider: ContaAzulProvider,
  ) {
    this.registerProviders();
  }

  private registerProviders() {
    this.providers.set('conta-azul', this.contaAzulProvider);
  }

  getProvider(name: string): OAuthProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(`Provider ${name} not found`);
    }
    return provider;
  }

  getAuthorizationUrl(providerName: string, state: string): string {
    const provider = this.getProvider(providerName);
    return provider.getAuthorizationUrl(state);
  }

  async exchangeCodeForToken(
    providerName: string,
    code: string,
  ): Promise<OAuthToken> {
    const provider = this.getProvider(providerName);
    return provider.exchangeCodeForToken(code);
  }

  async saveIntegration(
    userId: string,
    providerName: string,
    accessToken: string,
    refreshToken: string | undefined,
    expiresIn: number,
  ): Promise<{ id: string; providerUserId: string }> {
    const provider = this.getProvider(providerName);
    const userInfo = await provider.getUserInfo(accessToken);

    const integration = await this.integrationRepository.upsert({
      userId,
      provider: providerName,
      providerUserId: userInfo.id,
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    });

    return {
      id: integration.id,
      providerUserId: integration.providerUserId,
    };
  }

  async refreshIntegrationToken(integrationId: string): Promise<void> {
    const integration = await this.integrationRepository.findById(
      integrationId,
    );

    if (!integration || !integration.refreshToken) {
      throw new BadRequestException('Integration or refresh token not found');
    }

    const provider = this.getProvider(integration.provider);
    const newToken = await provider.refreshAccessToken(
      integration.refreshToken,
    );

    await this.integrationRepository.update(integrationId, {
      accessToken: newToken.accessToken,
      refreshToken: newToken.refreshToken || integration.refreshToken,
      accessTokenExpiresAt: new Date(Date.now() + newToken.expiresIn * 1000),
    });
  }

  async getActiveIntegration(userId: string, providerName: string) {
    return this.integrationRepository.findByUserAndProvider(
      userId,
      providerName,
    );
  }
}
