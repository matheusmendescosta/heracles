import { Injectable, Logger } from '@nestjs/common';
import { TokenValidationHelper } from './token-validation.helper';

/**
 * Exemplo de serviço que integra com a API Conta Azul
 * Demonstra como usar o TokenValidationHelper para garantir tokens válidos
 *
 * Este arquivo é um exemplo - você pode adaptar para seus próprios serviços
 */
@Injectable()
export class ContaAzulExampleService {
  private readonly logger = new Logger(ContaAzulExampleService.name);

  constructor(private tokenHelper: TokenValidationHelper) {}

  /**
   * Exemplo: Listar clientes do Conta Azul
   * Garante que o token é válido antes de fazer a requisição
   */
  async listarClientes(userId: string): Promise<any> {
    try {
      // Obter token válido (renova se necessário)
      const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');

      this.logger.debug(
        `Buscando clientes para usuário ${userId} com token válido`,
      );

      // Fazer requisição com token válido
      const response = await fetch(
        'https://api-v2.contaazul.com/v1/pessoas?tipo=CLIENTE',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API Conta Azul: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      this.logger.log(`✅ Encontrados ${data?.length || 0} clientes`);

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao listar clientes: ${message}`);
      throw error;
    }
  }

  /**
   * Exemplo: Criar novo cliente no Conta Azul
   * Valida integração e renova token se necessário
   */
  async criarCliente(
    userId: string,
    clienteData: { nome: string; email: string; telefone: string },
  ): Promise<any> {
    try {
      // Verificar se integração está ativa antes de fazer operação
      const isValid = await this.tokenHelper.isTokenValid(userId, 'conta-azul');

      if (!isValid) {
        throw new Error(
          'Token inválido ou integração expirada. Faça login novamente.',
        );
      }

      // Obter token válido
      const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');

      this.logger.debug(`Criando novo cliente para usuário ${userId}`);

      const response = await fetch(
        'https://api-v2.contaazul.com/v1/pessoas',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: clienteData.nome,
            email: clienteData.email,
            telefone: clienteData.telefone,
            tipo: 'CLIENTE',
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Erro ao criar cliente: ${errorData?.message || response.statusText}`,
        );
      }

      const data = await response.json();
      this.logger.log(`✅ Cliente criado com sucesso: ${data?.id}`);

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao criar cliente: ${message}`);
      throw error;
    }
  }

  /**
   * Exemplo: Verificar status do token antes de operação sensível
   * Útil para validar antes de processar grandes lotes
   */
  async verificarStatusIntegracao(userId: string): Promise<{
    isValid: boolean;
    expiresIn: number;
    expiresAt: Date;
  }> {
    const expiryInfo = await this.tokenHelper.getTokenExpiryInfo(
      userId,
      'conta-azul',
    );

    if (!expiryInfo) {
      throw new Error(
        'Integração do Conta Azul não encontrada para este usuário',
      );
    }

    this.logger.log(
      `Status da integração: ${expiryInfo.isExpired ? '❌ Expirado' : '✅ Válido'} - Expira em ${(expiryInfo.expiresIn / 1000 / 60).toFixed(2)} minutos`,
    );

    return {
      isValid: !expiryInfo.isExpired,
      expiresIn: expiryInfo.expiresIn,
      expiresAt: expiryInfo.expiresAt,
    };
  }

  /**
   * Exemplo: Processar com retry em caso de token inválido
   * Útil para operações críticas
   */
  async processarComRetry(
    userId: string,
    callback: (token: string) => Promise<any>,
    maxRetries: number = 2,
  ): Promise<any> {
    let tentativa = 0;

    while (tentativa < maxRetries) {
      try {
        const token = await this.tokenHelper.getValidToken(
          userId,
          'conta-azul',
        );
        return await callback(token);
      } catch (error) {
        tentativa++;

        if (tentativa >= maxRetries) {
          throw error;
        }

        this.logger.warn(
          `Tentativa ${tentativa}/${maxRetries} falhou, tentando novamente...`,
        );

        // Aguardar um pouco antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}
