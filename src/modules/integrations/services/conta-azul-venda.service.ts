import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from 'src/generated/prisma/internal/prismaNamespace';
import { TokenValidationHelper } from './token-validation.helper';
import { PrismaService } from 'src/prisma/prisma.service';

interface VendaItem {
  id: string;
  descricao: string;
  quantidade: number;
  valor: number;
  valor_custo?: number;
}

interface Parcela {
  data_vencimento: string;
  valor: number;
}

interface VendaData {
  id_cliente: string;
  situacao: 'EM_ANDAMENTO' | 'APROVADO';
  data_venda: string;
  itens: VendaItem[];
  condicao_pagamento: string; // Enum como string: "DINHEIRO", "CARTAO_CREDITO", etc
  parcelas: Parcela[];
}

@Injectable()
export class ContaAzulVendaService {
  private readonly logger = new Logger(ContaAzulVendaService.name);
  private readonly baseUrl = 'https://api-v2.contaazul.com';

  constructor(
    private tokenHelper: TokenValidationHelper,
    private prisma: PrismaService,
  ) {}

  /**
   * Obtém o próximo número de venda disponível
   */
  async obterProximoNumeroVenda(userId: string): Promise<number> {
    try {
      const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');

      const response = await fetch(`${this.baseUrl}/v1/venda/proximo-numero`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Aviso: Não foi possível obter próximo número de venda (${response.status})`,
        );
        // Fallback: usar número aleatório
        return Math.floor(Math.random() * 1000000);
      }

      const proximoNumero = await response.json();
      this.logger.debug(`Próximo número de venda obtido: ${proximoNumero}`);
      return proximoNumero;
    } catch (error) {
      this.logger.warn(`Erro ao obter próximo número, usando fallback`);
      return Math.floor(Math.random() * 1000000);
    }
  }

  /**
   * Gera um UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Cria uma venda no Conta Azul baseado em um orçamento
   */
  async criarVendaDoOrcamento(
    userId: string,
    idClienteContaAzul: string,
    numero: number,
    itens: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      productId?: string;
      serviceId?: string;
      selectedOptionIds?: string[];
    }>,
    totalValue: number,
    notes?: string,
  ): Promise<any> {
    try {
      // Obter token válido
      const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');

      this.logger.debug(
        `Criando venda no Conta Azul para cliente ${idClienteContaAzul}`,
      );

      // Obter o próximo número de venda disponível
      const numeroVenda = await this.obterProximoNumeroVenda(userId);
      this.logger.debug(`Usando número de venda: ${numeroVenda}`);

      this.logger.debug(
        `ID do cliente recebido (tipo: ${typeof idClienteContaAzul}): "${idClienteContaAzul}"`,
      );

      // Formatar data no padrão esperado (YYYY-MM-DD)
      const dataVenda = new Date().toISOString().split('T')[0];

      // Mapear itens do orçamento para o formato da API
      const vendaItens: VendaItem[] = await Promise.all(
        itens.map(async (item) => {
          let idContaAzul = this.generateUUID(); // Fallback: UUID aleatório

          // Obter o ID do Conta Azul do produto
          if (item.productId) {
            const produto = await this.prisma.product.findUnique({
              where: { id: item.productId },
              select: { idContaAzul: true },
            });
            if (produto?.idContaAzul) {
              idContaAzul = produto.idContaAzul;
              this.logger.debug(
                `Usando ID do Conta Azul do produto: ${idContaAzul}`,
              );
            }
          }

          // Obter o ID do Conta Azul do serviço
          if (item.serviceId) {
            const servico = await this.prisma.service.findUnique({
              where: { id: item.serviceId },
              select: { idContaAzul: true },
            });
            if (servico?.idContaAzul) {
              idContaAzul = servico.idContaAzul;
              this.logger.debug(
                `Usando ID do Conta Azul do serviço: ${idContaAzul}`,
              );
            }
          }

          return {
            id: idContaAzul,
            descricao: item.description,
            quantidade: item.quantity,
            valor: Math.round(item.unitPrice * 100) / 100,
          };
        }),
      );

      // Preparar payload da venda - com todos os campos obrigatórios corretos
      const vendaPayload: any = {
        id_cliente: idClienteContaAzul,
        numero: numeroVenda, // Usar número dinâmico da API
        situacao: 'EM_ANDAMENTO',
        data_venda: dataVenda,
        itens: vendaItens.map(item => ({
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor: item.valor,
          id: item.id,
        })),
        condicao_pagamento: {
          tipo_pagamento: 'DINHEIRO',
          opcao_condicao_pagamento: 'À vista',
          parcelas: [
            {
              data_vencimento: dataVenda,
              valor: totalValue,
            },
          ],
        },
      };

      this.logger.debug(
        `Payload enviado para criar venda: ${JSON.stringify(vendaPayload)}`,
      );

      const bodyString = JSON.stringify(vendaPayload);
      this.logger.debug(`Body string: ${bodyString}`);
      this.logger.debug(`Body length: ${bodyString.length}`);

      // Fazer requisição na API do Conta Azul
      const response = await fetch(`${this.baseUrl}/v1/venda`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendaPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData?.message ||
          errorData?.error ||
          response.statusText ||
          'Erro desconhecido';

        this.logger.error(
          `Erro ao criar venda no Conta Azul: ${response.status} - ${errorMessage}`,
        );

        this.logger.error(
          `Resposta completa do erro: ${JSON.stringify(errorData)}`,
        );

        throw new Error(
          `Falha ao criar venda no Conta Azul: ${errorMessage}`,
        );
      }

      const venda = await response.json();

      this.logger.log(
        `✅ Venda criada com sucesso no Conta Azul: ${venda?.id || venda?.numero}`,
      );

      return venda;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao criar venda: ${message}`);
      throw error;
    }
  }

  /**
   * Cria uma venda no Conta Azul com payload customizado
   * Para casos que precisam de mais controle
   */
  async criarVenda(userId: string, vendaPayload: VendaData): Promise<any> {
    try {
      // Obter token válido
      const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');

      this.logger.debug(`Criando venda customizada no Conta Azul`);

      const response = await fetch(`${this.baseUrl}/v1/venda`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendaPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData?.message ||
          errorData?.error ||
          response.statusText ||
          'Erro desconhecido';

        this.logger.error(
          `Erro ao criar venda no Conta Azul: ${response.status} - ${errorMessage}`,
        );

        this.logger.error(
          `Resposta completa do erro: ${JSON.stringify(errorData)}`,
        );

        throw new Error(
          `Falha ao criar venda no Conta Azul: ${errorMessage}`,
        );
      }

      const venda = await response.json();

      this.logger.log(
        `✅ Venda criada com sucesso: ${venda?.id || venda?.numero}`,
      );

      return venda;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao criar venda: ${message}`);
      throw error;
    }
  }
}
