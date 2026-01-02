# 🆕 Criar Pessoa/Cliente no Conta Azul

## 📖 Visão Geral

Agora você pode criar pessoas (clientes, fornecedores) diretamente no Conta Azul ao criar um orçamento. O serviço `ContaAzulPessoaService` cuida de toda a integração com a API do Conta Azul.

---

## 🎯 Campos Obrigatórios

A API do Conta Azul requer apenas **3 campos**:

| Campo | Tipo | Exemplo |
|-------|------|---------|
| `nome` | string | "João Silva" |
| `tipo_pessoa` | enum | "Física" \| "Jurídica" \| "Estrangeira" |
| `perfis[].tipo_perfil` | enum | "Cliente" \| "Fornecedor" \| "Transportadora" |

---

## 🚀 Como Usar - 3 Cenários

### Cenário 1: Criar Cliente Local E no Conta Azul (Automático)

Ao criar um orçamento com um novo cliente, solicite a criação no Conta Azul:

```json
POST /quotes
{
  "number": 1001,
  "totalValue": 1000,
  "client": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "(11) 99999-9999"
  },
  "items": [...],
  "criarClienteNoContaAzul": true,
  "criarVendaNoContaAzul": true
}
```

**O que acontece:**
1. ✅ Cliente criado no banco local (seu sistema)
2. ✅ Cliente criado no Conta Azul (pessoa física)
3. ✅ ID do cliente Conta Azul retornado automaticamente
4. ✅ Venda criada usando o novo ID

**Resposta esperada:**
```json
{
  "id": "uuid-orcamento",
  "number": 1001,
  "status": "DRAFT",
  "message": "Orçamento criado com sucesso"
}
```

**Logs esperados:**
```
[CreateQuoteController] Criando cliente no Conta Azul: João Silva
[ContaAzulPessoaService] Criando pessoa no Conta Azul: João Silva (Física)
[CreateQuoteController] ✅ Cliente criado com sucesso no Conta Azul: 123e4567-e89b-12d3-a456-426614174000
[CreateQuoteController] Criando venda no Conta Azul para o orçamento ...
[CreateQuoteController] ✅ Venda criada com sucesso no Conta Azul
```

---

### Cenário 2: Cliente Já Existe no Conta Azul

Se o cliente já existe no Conta Azul, apenas forneça o ID:

```json
POST /quotes
{
  "number": 1002,
  "totalValue": 1000,
  "clientId": "uuid-cliente-local",
  "idClienteContaAzul": "123e4567-e89b-12d3-a456-426614174000",
  "criarVendaNoContaAzul": true
}
```

**Comportamento:**
- ✅ Não cria novo cliente (usa o `clientId` local existente)
- ✅ Não tenta criar no Conta Azul
- ✅ Cria venda usando o `idClienteContaAzul` fornecido

---

### Cenário 3: Usar o Serviço Diretamente

Para criar uma pessoa fora do contexto de orçamento:

```typescript
import { ContaAzulPessoaService } from 'src/modules/integrations/services/conta-azul-pessoa.service';

constructor(private pessoaService: ContaAzulPessoaService) {}

// Criar cliente simples
const cliente = await this.pessoaService.criarCliente(
  userId,
  "João Silva",
  "joao@email.com",
  "(11) 99999-9999"
);

// Criar fornecedor
const fornecedor = await this.pessoaService.criarFornecedor(
  userId,
  "Distribuições ABC LTDA",
  "12.345.678/0001-90",
  "contato@distribuicoes.com"
);

// Criar com dados completos
const pessoaCompleta = await this.pessoaService.criarPessoa(userId, {
  nome: "João Silva",
  tipo_pessoa: "Física",
  tipo_perfil: "Cliente",
  email: "joao@email.com",
  telefone_celular: "(11) 99999-9999",
  endereco: {
    logradouro: "Rua das Flores",
    numero: "123",
    bairro: "Centro",
    cep: "01234-567",
    cidade: "São Paulo",
    estado: "SP"
  }
});
```

---

## 📚 Interface Completa de Dados

### `criarPessoa(userId, data)`

```typescript
interface CriarPessoaData {
  // OBRIGATÓRIOS
  nome: string;
  tipo_pessoa: 'Física' | 'Jurídica' | 'Estrangeira';
  tipo_perfil: 'Cliente' | 'Fornecedor' | 'Transportadora';
  
  // OPCIONAIS
  email?: string;
  cpf?: string;                    // Apenas para Física
  cnpj?: string;                   // Apenas para Jurídica
  telefone_comercial?: string;
  telefone_celular?: string;
  observacao?: string;
  
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cep: string;
    cidade: string;
    estado: string;
    pais?: string;              // Padrão: Brasil
  };
  
  outro_contato?: {
    nome: string;
    email?: string;
    telefone_comercial?: string;
    telefone_celular?: string;
    cargo?: string;
  };
}
```

---

## 🎯 Métodos Simplificados

### `criarCliente(userId, nome, email?, telefone?)`

Cria uma **pessoa física** como **cliente**:

```typescript
const cliente = await this.pessoaService.criarCliente(
  userId,
  "Maria Silva",
  "maria@email.com",
  "(11) 98765-4321"
);
// Retorna: { id: "uuid", nome: "Maria Silva", ... }
```

### `criarFornecedor(userId, nome, cnpj?, email?)`

Cria uma **pessoa jurídica** como **fornecedor**:

```typescript
const fornecedor = await this.pessoaService.criarFornecedor(
  userId,
  "Distribuidora XYZ LTDA",
  "98.765.432/0001-10",
  "contato@distribuidora.com"
);
```

---

## 🔍 Exemplo Completo - Requisição cURL

```bash
curl -X POST http://localhost:3000/quotes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number": 1005,
    "notes": "Novo cliente criado automaticamente",
    "totalValue": 5000,
    "client": {
      "name": "Empresa ABC LTDA",
      "email": "contato@empresaabc.com",
      "phone": "(11) 3000-0000"
    },
    "items": [
      {
        "description": "Consultoria Inicial",
        "quantity": 1,
        "unitPrice": 3000,
        "total": 3000
      },
      {
        "description": "Implementação",
        "quantity": 1,
        "unitPrice": 2000,
        "total": 2000
      }
    ],
    "criarClienteNoContaAzul": true,
    "criarVendaNoContaAzul": true
  }'
```

---

## 📝 Resposta do Serviço

Quando `criarClienteNoContaAzul: true`, a resposta da API do Conta Azul é:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nome": "Empresa ABC LTDA",
  "email": "contato@empresaabc.com",
  "telefone_celular": "(11) 3000-0000",
  "tipo_pessoa": "Física",
  "ativo": true,
  "perfis": [
    {
      "tipo_perfil": "Cliente"
    }
  ]
}
```

**O ID (`id`) é salvo automaticamente em `idClienteContaAzul` para criar a venda.**

---

## ✅ Fluxo Automático Completo

```
POST /quotes com criarClienteNoContaAzul: true
    ↓
[Criar cliente local]
    ↓
[Criar cliente no Conta Azul]
    ↓
[Capturar ID retornado]
    ↓
[Criar venda usando o novo ID]
    ↓
[Retornar sucesso]
```

---

## 🐛 Tratamento de Erros

Se a criação no Conta Azul falhar:
- ❌ O cliente **local continua sendo criado**
- ❌ A venda **não é criada** (precisa do ID do cliente)
- 📝 O erro é **logado** para referência

```
[CreateQuoteController] ❌ Erro ao criar cliente no Conta Azul: Cliente já existe
```

O orçamento continua sendo criado, mas você precisará:
1. Corrigir o erro
2. Criar a venda manualmente
3. Ou fornecer o `idClienteContaAzul` correto

---

## 🔄 Armazenar Relação no Banco

Para facilitar futuras operações, você pode adicionar um campo ao modelo:

```prisma
model Client {
  id             String  @id @default(uuid())
  name           String
  email          String  @unique
  idContaAzul    String?  // ← Campo novo
  // ...
}
```

Depois atualizar o controller para salvar:

```typescript
const createdClient = await this.prisma.client.create({
  data: {
    name: client.name,
    email: client.email,
    idContaAzul: finalIdClienteContaAzul,  // ← Salvar ID
    // ...
  },
});
```

---

## 🎯 Resumo dos Campos do Orçamento

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `criarClienteNoContaAzul` | boolean | Não | Se `true`, cria cliente no Conta Azul |
| `criarVendaNoContaAzul` | boolean | Não | Se `true`, cria venda no Conta Azul |
| `idClienteContaAzul` | string | Sim* | ID do cliente no Conta Azul para criar venda |
| `client` | object | Sim** | Dados do cliente local a ser criado |
| `clientId` | string | Sim** | ID de um cliente local existente |

*Obrigatório apenas se `criarVendaNoContaAzul: true` e `criarClienteNoContaAzul: false`
**Um dos dois deve ser fornecido

---

**Pronto para usar! 🚀**
