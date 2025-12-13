import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OAuthService } from '../oauth/oauth.service';
import { IntegrationRepository } from '../repositories/integration.repository';

/**
 * Serviço responsável por renovar tokens OAuth expirando de forma automática
 * utilizando Cron Jobs para evitar que tokens se tornem inválidos
 */
@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private oauthService: OAuthService,
    private integrationRepository: IntegrationRepository,
  ) {}

  /**
   * Executa a cada hora para renovar tokens que vão expirar
   * Busca integrações que expiram em 5 minutos e renova proativamente
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async refreshExpiringTokens(): Promise<void> {
    this.logger.debug('Iniciando verificação de tokens para renovação automática');

    try {
      // DEBUG: Buscar TODAS as integrações ativas para diagnosticar
      const allIntegrations =
        await this.integrationRepository.findAllActiveIntegrations();

      this.logger.debug(
        `📊 Total de integrações ativas com refresh token: ${allIntegrations.length}`,
      );

      if (allIntegrations.length > 0) {
        const now = new Date();
        allIntegrations.forEach((integration) => {
          const minutesUntilExpiry = Math.round(
            (integration.accessTokenExpiresAt.getTime() - now.getTime()) / 60000,
          );
          this.logger.debug(
            `  • ${integration.id} (${integration.provider}): Expira em ${minutesUntilExpiry} minutos`,
          );
        });
      }

      // Buscar todas as integrações que vão expirar nos próximos 5 minutos
      const expiringIntegrations =
        await this.integrationRepository.findExpiringTokens(5);

      if (expiringIntegrations.length === 0) {
        this.logger.debug('⏳ Nenhum token para renovar agora (próxima verificação em 1 minuto)');
        return;
      }

      this.logger.log(
        `🔄 Encontrados ${expiringIntegrations.length} tokens expirando, iniciando renovação`,
      );

      // Renovar cada token de forma independente
      for (const integration of expiringIntegrations) {
        try {
          this.logger.debug(
            `Renovando token para integração ${integration.id} (${integration.provider})`,
          );

          await this.oauthService.refreshIntegrationToken(integration.id);

          this.logger.log(
            `✅ Token renovado com sucesso: ${integration.id} (${integration.userId})`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Erro ao renovar token ${integration.id}: ${error instanceof Error ? error.message : String(error)}`,
          );

          // Se o refresh token também expirou, marcar integração como inativa
          if (
            error instanceof Error &&
            (error.message.includes('invalid_grant') ||
              error.message.includes('refresh_token'))
          ) {
            try {
              await this.integrationRepository.toggleActive(
                integration.id,
                false,
              );
              this.logger.warn(
                `Integração ${integration.id} marcada como inativa (refresh token expirado)`,
              );
            } catch (deactivateError) {
              this.logger.error(
                `Erro ao desativar integração ${integration.id}: ${deactivateError instanceof Error ? deactivateError.message : String(deactivateError)}`,
              );
            }
          }
        }
      }

      this.logger.log('✅ Ciclo de renovação automática de tokens concluído');
    } catch (error) {
      this.logger.error(
        `Erro crítico no ciclo de renovação de tokens: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Executa a cada 6 horas para limpar integrações inativas expiradas
   * Remove integrações que estão inativas há mais de 30 dias
   */
  @Cron('0 */6 * * *') // A cada 6 horas
  async cleanupExpiredInactiveIntegrations(): Promise<void> {
    this.logger.debug('Iniciando limpeza de integrações expiradas e inativas');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.integrationRepository.deleteInactiveOlderThan(
        thirtyDaysAgo,
      );

      if (result.count > 0) {
        this.logger.log(
          `✅ ${result.count} integrações inativas removidas com sucesso`,
        );
      } else {
        this.logger.debug('Nenhuma integração inativa para remover');
      }
    } catch (error) {
      this.logger.error(
        `Erro ao limpar integrações: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
