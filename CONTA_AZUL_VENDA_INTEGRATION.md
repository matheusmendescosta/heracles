# Integração de Vendas com Conta Azul

## Visão Geral

Após criar um orçamento, você pode opcionalmente criar uma venda correspondente no Conta Azul. Esta integração automatiza a sincronização de orçamentos com o sistema de vendas.

## Como Usar

### Ao criar um orçamento, adicione os seguintes campos opcionais:

```json
{
  "number": 1001,
  "notes": "Observações sobre o orçamento",
  "totalValue": 1000,
  "clientId": "cliente-id-ou",
  "client": {
    "name": "Nome do Cliente",
    "email": "cliente@exemplo.com",
    "document": "12345678901",
    "phone": "(11) 99999-9999",
    "address": "Rua Exemplo, 123"
  },
  "items": [
    {
      "description": "Produto A",
      "quantity": 2,
      "unitPrice": 100,
      "total": 200,
      "productId": "produto-id-opcional"
    }
  ],
  "idClienteContaAzul": "123e4567-e89b-12d3-a456-426614174000",
  "criarVendaNoContaAzul": true
}
```

### Parâmetros Novos

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `idClienteContaAzul` | UUID | ID do cliente no Conta Azul | Sim* |
| `criarVendaNoContaAzul` | boolean | Ativa a criação de venda no Conta Azul | Não |

*Obrigatório apenas se `criarVendaNoContaAzul` for `true`.

## Como Funciona

1. **Criação do Orçamento**: O orçamento é criado normalmente no banco de dados
2. **Criação da Venda**: Se `criarVendaNoContaAzul` for `true`:
   - Uma venda é criada no Conta Azul com os dados do orçamento
   - A venda é criada com status `EM_ANDAMENTO`
   - Se houver erro na criação da venda, apenas um log é registrado e o orçamento continua sendo criado com sucesso

## Serviço ContaAzulVendaService

O novo serviço `ContaAzulVendaService` fornece dois métodos principais:

### 1. `criarVendaDoOrcamento()`

```typescript
await this.vendaService.criarVendaDoOrcamento(
  userId: string,           // ID do usuário autenticado
  idClienteContaAzul: string, // ID do cliente no Conta Azul
  numero: number,            // Número sequencial da venda
  itens: Array<{            // Items do orçamento
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>,
  totalValue: number,        // Valor total da venda
  notes?: string             // Observações opcionais
);
```

### 2. `criarVenda()`

Para casos que precisam de mais controle sobre os parâmetros da venda:

```typescript
const vendaPayload = {
  id_cliente: "cliente-id",
  numero: 1001,
  situacao: "EM_ANDAMENTO",
  data_venda: "2024-01-02",
  observacoes: "Observações sobre a venda",
  itens: [
    {
      descricao: "Produto",
      quantidade: 2,
      valor: 100,
      valor_custo: 80
    }
  ],
  composicao_de_valor: {
    frete: 0,
    desconto: {
      tipo: "VALOR",
      valor: 0
    }
  }
};

await this.vendaService.criarVenda(userId, vendaPayload);
```

## Exemplo de Requisição cURL

```bash
curl -X POST http://localhost:3000/quotes \
  -H "Authorization: Bearer {SEU_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "number": 1001,
    "notes": "Venda importante",
    "totalValue": 1500,
    "client": {
      "name": "João da Silva",
      "email": "joao@exemplo.com"
    },
    "items": [
      {
        "description": "Consultoria",
        "quantity": 1,
        "unitPrice": 1500,
        "total": 1500
      }
    ],
    "idClienteContaAzul": "123e4567-e89b-12d3-a456-426614174000",
    "criarVendaNoContaAzul": true
  }'
```

## Resposta de Sucesso

```json
{
  "id": "uuid-do-orcamento",
  "number": 1001,
  "status": "DRAFT",
  "message": "Orçamento criado com sucesso"
}
```

## Tratamento de Erros

- Se a venda não for criada no Conta Azul, um erro é logado, mas o orçamento continua sendo criado
- Erros comuns:
  - Token expirado: O token é renovado automaticamente
  - Cliente inválido: Verificar se `idClienteContaAzul` é válido
  - Dados inválidos: Verificar o formato dos itens

## Requisitos

1. O usuário deve ter uma integração ativa com Conta Azul
2. O token OAuth do Conta Azul deve ser válido ou renovável
3. O cliente deve existir no Conta Azul com o ID fornecido
