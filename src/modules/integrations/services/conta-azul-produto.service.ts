import { Injectable, Logger } from '@nestjs/common';
import { TokenValidationHelper } from './token-validation.helper';

interface CriarProdutoPayload {
  nome: string;
  descricao?: string;
  ativo: boolean;
  status: 'ATIVO' | 'INATIVO';
  codigo_sku?: string;
  estoque: {
    valor_venda: number;
    estoque_disponivel: number;
    estoque_minimo: number;
    estoque_maximo: number;
    custo_medio: number;
  };
}

@Injectable()
export class ContaAzulProdutoService {
  private readonly logger = new Logger(ContaAzulProdutoService.name);
  private readonly baseUrl = 'https://api-v2.contaazul.com';

  constructor(private tokenHelper: TokenValidationHelper) {}

  /**
   * Cria um produto no Conta Azul
   */
  async criarProduto(
    userId: string,
    nome: string,
    descricao: string | undefined,
    preco: number,
    stock: number,
    sku?: string,
  ): Promise<any> {
    try {
      // Obter token válido
      const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');

      this.logger.debug(`Criando produto no Conta Azul: ${nome}`);

      // Preparar payload
      const payload: CriarProdutoPayload = {
        nome,
        descricao: descricao || `Produto: ${nome}`,
        ativo: true,
        status: 'ATIVO',
        codigo_sku: sku,
        estoque: {
          valor_venda: Math.round(preco * 100) / 100,
          estoque_disponivel: stock,
          estoque_minimo: 0, // Mínimo é 0
          estoque_maximo: Math.max(stock * 2, stock + 10), // Máximo é o dobro do stock ou stock + 10
          custo_medio: Math.round(preco * 100) / 100, // Custo médio é igual ao preço
        },
      };

      this.logger.debug(
        `Payload enviado para criar produto: ${JSON.stringify(payload)}`,
      );

      // Fazer requisição na API do Conta Azul
      const response = await fetch(`${this.baseUrl}/v1/produtos`, {
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
          `Erro ao criar produto no Conta Azul: ${response.status} - ${errorMessage}`,
        );

        this.logger.error(
          `Resposta completa do erro: ${JSON.stringify(errorData)}`,
        );

        throw new Error(
          `Falha ao criar produto no Conta Azul: ${errorMessage}`,
        );
      }

      const produto = await response.json();

      this.logger.log(
        `✅ Produto criado com sucesso no Conta Azul: ${produto?.id}`,
      );

      return produto;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao criar produto: ${message}`);
      throw error;
    }
  }
}
