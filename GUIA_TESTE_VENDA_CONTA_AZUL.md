# Guia de Teste - Integração de Vendas Conta Azul

## 🧪 Teste Prático Passo a Passo

### Pré-requisitos
- ✅ JWT token válido do usuário autenticado
- ✅ Integração ativa com Conta Azul (token OAuth)
- ✅ ID de um cliente existente no Conta Azul

### Passo 1: Obter o JWT Token

```bash
# Fazer login
curl -X POST http://localhost:3000/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "sua-senha"
  }'

# Salvar o token da resposta
export JWT="token-aqui"
```

### Passo 2: Obter ID de um Cliente Conta Azul

```bash
# Se você tiver a integração ativa, pode listar clientes
curl http://localhost:3000/oauth/conta-azul/clientes \
  -H "Authorization: Bearer $JWT"

# Ou obter de um cliente existente no banco de dados
curl http://localhost:3000/clients \
  -H "Authorization: Bearer $JWT"

# Salvar um ID de cliente válido
export CLIENT_ID="123e4567-e89b-12d3-a456-426614174000"
```

### Passo 3: Teste SEM Venda no Conta Azul (Comportamento Anterior)

```bash
curl -X POST http://localhost:3000/quotes \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "number": 1001,
    "notes": "Teste sem venda",
    "totalValue": 1000,
    "clientId": "uuid-do-cliente-local",
    "items": [
      {
        "description": "Produto Teste",
        "quantity": 1,
        "unitPrice": 1000,
        "total": 1000
      }
    ]
  }'

# Resposta esperada:
# {
#   "id": "uuid-do-orcamento",
#   "number": 1001,
#   "status": "DRAFT",
#   "message": "Orçamento criado com sucesso"
# }
```

### Passo 4: Teste COM Venda no Conta Azul (Novo)

```bash
curl -X POST http://localhost:3000/quotes \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "number": 1002,
    "notes": "Teste com venda Conta Azul",
    "totalValue": 1500,
    "client": {
      "name": "Cliente Teste",
      "email": "teste@exemplo.com",
      "phone": "(11) 99999-9999"
    },
    "items": [
      {
        "description": "Consultoria",
        "quantity": 1,
        "unitPrice": 1500,
        "total": 1500
      }
    ],
    "idClienteContaAzul": "'$CLIENT_ID'",
    "criarVendaNoContaAzul": true
  }'
```

### Passo 5: Verificar Logs

```bash
# Em outro terminal, veja os logs da aplicação
# Procure por linhas como:
# [CreateQuoteController] Criando venda no Conta Azul para o orçamento ...
# [CreateQuoteController] ✅ Venda criada com sucesso no Conta Azul
```

## 📊 Cenários de Teste

### Cenário 1: Sucesso Completo
**Objetivo**: Criar orçamento e venda com sucesso

```json
{
  "number": 2001,
  "notes": "Cenário de sucesso",
  "totalValue": 5000,
  "client": {
    "name": "Empresa ABC",
    "email": "contato@abc.com",
    "document": "12.345.678/0001-90"
  },
  "items": [
    {"description": "Item 1", "quantity": 2, "unitPrice": 2000, "total": 4000},
    {"description": "Item 2", "quantity": 1, "unitPrice": 1000, "total": 1000}
  ],
  "idClienteContaAzul": "uuid-cliente",
  "criarVendaNoContaAzul": true
}
```

**Resultado esperado**:
- ✅ Orçamento criado no banco
- ✅ Venda criada no Conta Azul
- ✅ Status 200 OK

### Cenário 2: Falha na Venda (Não impede orçamento)
**Objetivo**: Testar que erro na venda não impede criação do orçamento

```json
{
  "number": 2002,
  "notes": "Cliente inválido",
  "totalValue": 1000,
  "clientId": "uuid-cliente-local",
  "items": [
    {"description": "Item", "quantity": 1, "unitPrice": 1000, "total": 1000}
  ],
  "idClienteContaAzul": "uuid-invalido",
  "criarVendaNoContaAzul": true
}
```

**Resultado esperado**:
- ✅ Orçamento criado no banco (SUCESSO)
- ❌ Venda não criada (ERRO LOGADO)
- ✅ Status 200 OK (não falha)
- 📝 Log de erro registrado

### Cenário 3: Sem Flag de Venda
**Objetivo**: Confirmar que sem flag não tenta criar venda

```json
{
  "number": 2003,
  "notes": "Sem flag de venda",
  "totalValue": 1000,
  "clientId": "uuid-cliente-local",
  "items": [
    {"description": "Item", "quantity": 1, "unitPrice": 1000, "total": 1000}
  ],
  "idClienteContaAzul": "uuid-cliente",
  "criarVendaNoContaAzul": false
}
```

**Resultado esperado**:
- ✅ Orçamento criado
- ⏭️ Venda não criada (flag = false)
- Nenhum log de tentativa de venda

## 🔍 Verificação de Sucesso

### No Banco de Dados
```sql
-- Ver orçamento criado
SELECT id, number, status, client_id FROM quotes ORDER BY created_at DESC LIMIT 5;

-- Ver cliente criado (se necessário)
SELECT id, name, email FROM clients ORDER BY created_at DESC LIMIT 5;
```

### No Conta Azul
1. Acesse o dashboard do Conta Azul
2. Vá para "Vendas"
3. Procure pela venda com o número correspondente
4. Verifique se os itens correspondem ao orçamento

## 🐛 Debug

### Se a venda não foi criada
1. **Verificar logs**
   ```bash
   # Procure por mensagens de erro em CreateQuoteController
   # Verificar se TokenValidationHelper conseguiu obter token
   ```

2. **Verificar token**
   ```bash
   # O token pode ter expirado
   # TokenValidationHelper deve renovar automaticamente
   # Se falhar, fazer login novamente
   ```

3. **Verificar cliente**
   ```bash
   # Confirmar que idClienteContaAzul é válido
   # Tentar listar clientes no Conta Azul
   ```

4. **Verificar dados**
   ```bash
   # Confirmar que os itens têm quantidade e preço positivos
   # Verificar que totalValue > 0
   ```

## 📈 Teste de Carga

Para testar com múltiplos orçamentos:

```bash
#!/bin/bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/quotes \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -d "{
      \"number\": $((3000 + i)),
      \"notes\": \"Teste de carga $i\",
      \"totalValue\": 1000,
      \"clientId\": \"uuid-cliente\",
      \"items\": [{
        \"description\": \"Item teste\",
        \"quantity\": 1,
        \"unitPrice\": 1000,
        \"total\": 1000
      }],
      \"idClienteContaAzul\": \"$CLIENT_ID\",
      \"criarVendaNoContaAzul\": true
    }"
  
  echo "Orçamento $i enviado"
  sleep 2  # Aguardar 2 segundos entre requisições
done
```

## ✅ Checklist Final

- [ ] JWT token obtido e funcional
- [ ] Cliente Conta Azul identificado
- [ ] Teste sem venda funciona
- [ ] Teste com venda funciona
- [ ] Venda visível no Conta Azul
- [ ] Logs aparecem corretamente
- [ ] Erro de venda não impede orçamento
- [ ] Banco de dados atualizado corretamente

---

**Pronto para usar em produção após todos os testes passarem! ✨**
