// Exemplo de como testar a criação de orçamento com venda no Conta Azul

// 1. Exemplo básico - Criar orçamento SEM venda
const exemplo1 = {
  number: 1001,
  notes: "Orçamento de consultoria",
  totalValue: 1000,
  clientId: "cliente-uuid-existente",
  items: [
    {
      description: "Consultoria Inicial",
      quantity: 1,
      unitPrice: 1000,
      total: 1000
    }
  ]
};

// 2. Exemplo com novo cliente e COM venda no Conta Azul
const exemplo2 = {
  number: 1002,
  notes: "Orçamento para projeto novo",
  totalValue: 5000,
  client: {
    name: "Acme Corporation",
    email: "contato@acme.com",
    document: "12.345.678/0001-90",
    phone: "(11) 3000-0000",
    address: "Av. Paulista, 1000 - São Paulo, SP"
  },
  items: [
    {
      description: "Desenvolvimento de Sistema",
      quantity: 1,
      unitPrice: 3000,
      total: 3000
    },
    {
      description: "Implementação de API",
      quantity: 1,
      unitPrice: 2000,
      total: 2000
    }
  ],
  idClienteContaAzul: "123e4567-e89b-12d3-a456-426614174000",
  criarVendaNoContaAzul: true
};

// 3. Exemplo com produtos existentes e opções
const exemplo3 = {
  number: 1003,
  notes: "Orçamento com produtos da catálogo",
  totalValue: 2500,
  clientId: "cliente-uuid-existente",
  items: [
    {
      description: "Licença Premium Anual",
      quantity: 2,
      unitPrice: 1000,
      total: 2000,
      productId: "produto-uuid",
      selectedOptionIds: ["opcao-1", "opcao-2"]
    },
    {
      description: "Suporte Prioritário",
      quantity: 1,
      unitPrice: 500,
      total: 500,
      serviceId: "servico-uuid"
    }
  ],
  idClienteContaAzul: "123e4567-e89b-12d3-a456-426614174000",
  criarVendaNoContaAzul: true
};

// 4. Teste com curl
const curlExample = `
curl -X POST http://localhost:3000/quotes \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": 1004,
    "notes": "Teste de integração",
    "totalValue": 1500,
    "client": {
      "name": "Cliente Teste",
      "email": "teste@exemplo.com",
      "phone": "(11) 99999-9999"
    },
    "items": [
      {
        "description": "Serviço de Teste",
        "quantity": 1,
        "unitPrice": 1500,
        "total": 1500
      }
    ],
    "idClienteContaAzul": "123e4567-e89b-12d3-a456-426614174000",
    "criarVendaNoContaAzul": true
  }'
`;

// 5. Resposta esperada de sucesso
const respostaEsperada = {
  id: "quoate-uuid-gerado",
  number: 1004,
  status: "DRAFT",
  message: "Orçamento criado com sucesso"
};

// 6. Como obter o ID do cliente no Conta Azul
// Você pode:
// - Criar o cliente via API e obter o ID
// - Buscar clientes existentes na API
// - Armazenar no banco de dados durante a integração inicial

const comoObterIdCliente = `
// Opção 1: Via integração existente
// O ContaAzulExampleService.listarClientes() retorna todos os clientes

// Opção 2: Ao criar um cliente no Conta Azul
const clienteCriado = await ContaAzulExampleService.criarCliente(userId, {
  nome: "Acme Corporation",
  email: "contato@acme.com",
  telefone: "(11) 3000-0000"
});
// clienteCriado.id será o ID necessário

// Opção 3: Armazenar no banco de dados quando o cliente integra
// Adicione um campo 'idContaAzul' na tabela 'clients'
`;

export { exemplo1, exemplo2, exemplo3, curlExample, respostaEsperada, comoObterIdCliente };
