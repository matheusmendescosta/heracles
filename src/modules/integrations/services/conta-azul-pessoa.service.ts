import { Injectable, Logger } from '@nestjs/common';
import { TokenValidationHelper } from './token-validation.helper';

interface EnderecoData {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  pais?: string;
}

interface OutroContatoData {
  nome: string;
  email?: string;
  telefone_comercial?: string;
  telefone_celular?: string;
  cargo?: string;
}

interface CriarPessoaData {
  nome: string;
  email?: string;
  tipo_pessoa?: 'Física' | 'Jurídica' | 'Estrangeira';
  tipo_perfil?: 'Cliente' | 'Fornecedor' | 'Transportadora';
}

@Injectable()
export class ContaAzulPessoaService {
  private readonly logger = new Logger(ContaAzulPessoaService.name);
  private readonly baseUrl = 'https://api-v2.contaazul.com';

  constructor(private tokenHelper: TokenValidationHelper) {}

  /**
   * Cria uma pessoa (cliente) no Conta Azul com campos obrigatórios apenas
   */
  async criarPessoa(
    userId: string,
    data: CriarPessoaData,
  ): Promise<any> {
    try {
      // Obter token válido
      const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');

      // Valores padrão
      const tipoPessoa = data.tipo_pessoa || 'Física';
      const tipoPerfil = data.tipo_perfil || 'Cliente';

      this.logger.debug(
        `Criando pessoa no Conta Azul: ${data.nome} (${tipoPessoa})`,
      );

      // Montar payload com campos obrigatórios
      const payload: any = {
        nome: data.nome,
        tipo_pessoa: tipoPessoa,
        perfis: [
          {
            tipo_perfil: tipoPerfil,
          },
        ],
      };

      // Adicionar email se fornecido
      if (data.email) {
        payload.email = data.email;
      }

      // Mockar outros campos para teste
      payload.ativo = true;
      payload.agencia_publica = false;
      payload.optante_simples = false;

      this.logger.debug(
        `Payload enviado para criar pessoa: ${JSON.stringify(payload)}`,
      );

      // Fazer requisição na API do Conta Azul
      const response = await fetch(`${this.baseUrl}/v1/pessoas`, {
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
          `Erro ao criar pessoa no Conta Azul: ${response.status} - ${errorMessage}`,
        );

        throw new Error(
          `Falha ao criar pessoa no Conta Azul: ${errorMessage}`,
        );
      }

      const pessoa = await response.json();

      this.logger.log(
        `✅ Pessoa criada com sucesso no Conta Azul: ${pessoa?.id || pessoa?.nome}`,
      );

      this.logger.debug(
        `Resposta completa da API: ${JSON.stringify(pessoa)}`,
      );

      return pessoa;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao criar pessoa: ${message}`);
      throw error;
    }
  }

  /**
   * Cria uma pessoa cliente (simplificado)
   */
  async criarCliente(
    userId: string,
    nome: string,
    email?: string,
    telefone?: string,
  ): Promise<any> {
    return this.criarPessoa(userId, {
      nome,
      email,
      tipo_pessoa: 'Física',
      tipo_perfil: 'Cliente',
    });
  }

  /**
   * Cria uma pessoa fornecedor
   */
  async criarFornecedor(
    userId: string,
    nome: string,
    cnpj?: string,
    email?: string,
  ): Promise<any> {
    return this.criarPessoa(userId, {
      nome,
      email,
      tipo_pessoa: 'Jurídica',
      tipo_perfil: 'Fornecedor',
    });
  }
}
