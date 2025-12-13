import { Injectable } from '@nestjs/common';
import { OAuthService } from '../oauth/oauth.service';

/**
 * Serviço auxiliar para validação e renovação de tokens OAuth sob demanda
 * Deve ser injetado em qualquer serviço que precise fazer requisições à API externa
 */
@Injectable()
export class TokenValidationHelper {
  constructor(private oauthService: OAuthService) {}

  /**
   * Obtém um token válido, renovando se necessário
   * Deve ser chamado antes de fazer requisições à API OAuth (ex: Conta Azul)
   *
   * @param userId ID do usuário
   * @param providerName Nome do provider (ex: 'conta-azul')
   * @returns Token válido pronto para usar
   *
   * @example
   * ```typescript
   * const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');
   * const response = await fetch(url, {
   *   headers: { 'Authorization': `Bearer ${token}` }
   * });
   * ```
   */
  async getValidToken(userId: string, providerName: string): Promise<string> {
    const integration = await this.oauthService.getActiveIntegration(
      userId,
      providerName,
    );

    if (!integration) {
      throw new Error(
        `Integração do ${providerName} não encontrada para o usuário ${userId}`,
      );
    }

    // Verificar se token expirou
    if (new Date() > integration.accessTokenExpiresAt) {
      // Token expirou, renovar
      await this.oauthService.refreshIntegrationToken(integration.id);

      // Buscar token atualizado
      const updated = await this.oauthService.getActiveIntegration(
        userId,
        providerName,
      );

      if (!updated) {
        throw new Error(
          `Erro ao renovar token do ${providerName} para o usuário ${userId}`,
        );
      }

      return updated.accessToken;
    }

    // Token ainda é válido
    return integration.accessToken;
  }

  /**
   * Verifica se o token está válido sem fazer renovação
   * Útil para validações antes de fazer operações
   *
   * @param userId ID do usuário
   * @param providerName Nome do provider
   * @returns true se o token é válido, false caso contrário
   */
  async isTokenValid(userId: string, providerName: string): Promise<boolean> {
    const integration = await this.oauthService.getActiveIntegration(
      userId,
      providerName,
    );

    if (!integration) {
      return false;
    }

    return new Date() <= integration.accessTokenExpiresAt;
  }

  /**
   * Obtém informações sobre quando um token expira
   * Útil para logging e auditoria
   *
   * @param userId ID do usuário
   * @param providerName Nome do provider
   * @returns Objeto com informações de expiração
   */
  async getTokenExpiryInfo(
    userId: string,
    providerName: string,
  ): Promise<{ isExpired: boolean; expiresIn: number; expiresAt: Date } | null> {
    const integration = await this.oauthService.getActiveIntegration(
      userId,
      providerName,
    );

    if (!integration) {
      return null;
    }

    const now = new Date();
    const expiresIn = integration.accessTokenExpiresAt.getTime() - now.getTime();

    return {
      isExpired: expiresIn < 0,
      expiresIn: Math.max(0, expiresIn),
      expiresAt: integration.accessTokenExpiresAt,
    };
  }
}
