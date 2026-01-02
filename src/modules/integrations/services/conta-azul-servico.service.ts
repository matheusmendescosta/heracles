import { Injectable, Logger } from '@nestjs/common';
import { TokenValidationHelper } from './token-validation.helper';

interface CriarServicoPayload {
  codigo: string; // Código único do serviço
  descricao: string;
  preco: number;
  custo: number;
  tipo_servico: 'PRESTADO' | 'PRODUTOS_SERVICOS'; // Tipo de serviço
  status: 'ATIVO' | 'INATIVO'; // Status do serviço
}

@Injectable()
export class ContaAzulServicoService {
  private readonly logger = new Logger(ContaAzulServicoService.name);
  private readonly baseUrl = 'https://api-v2.contaazul.com';

  constructor(private tokenHelper: TokenValidationHelper) {}

  /**
   * Cria um serviço no Conta Azul
   */
  async criarServico(
    userId: string,
    nome: string,
    descricao: string | undefined,
    preco: number,
  ): Promise<any> {
    try {
      // Obter token válido
      const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');

      this.logger.debug(`Criando serviço no Conta Azul: ${nome}`);

      // Gerar código único para o serviço (usando nome + timestamp)
      const codigo = `SERV-${Date.now()}`;

      // Preço e custo são iguais
      const precoFormatado = Math.round(preco * 100) / 100;

      // Preparar payload
      const payload: CriarServicoPayload = {
        codigo,
        descricao: descricao || `Serviço: ${nome}`,
        preco: precoFormatado,
        custo: precoFormatado, // Mesmo valor do preço
        tipo_servico: 'PRESTADO',
        status: 'ATIVO',
      };

      this.logger.debug(
        `Payload enviado para criar serviço: ${JSON.stringify(payload)}`,
      );

      // Fazer requisição na API do Conta Azul
      const response = await fetch(`${this.baseUrl}/v1/servicos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData?.message ||
          errorData?.error ||
          response.statusText ||
          'Erro desconhecido';

        this.logger.error(
          `Erro ao criar serviço no Conta Azul: ${response.status} - ${errorMessage}`,
        );

        this.logger.error(
          `Resposta completa do erro: ${JSON.stringify(errorData)}`,
        );

        throw new Error(
          `Falha ao criar serviço no Conta Azul: ${errorMessage}`,
        );
      }

      const servico = await response.json();

      this.logger.log(
        `✅ Serviço criado com sucesso no Conta Azul: ${servico?.id || servico?.codigo}`,
      );

      return servico;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao criar serviço: ${message}`);
      throw error;
    }
  }
}
