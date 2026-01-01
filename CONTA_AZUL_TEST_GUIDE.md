# 🧪 Teste de Integração Conta Azul - Guia Prático

## Resumo das Correções Realizadas

### ✅ Etapa 1: Solicitar Código de Autorização
**Problema**: URL incorreta  
**Corrigido para**: `https://auth.contaazul.com/login`  
**Scope correto**: `openid profile aws.cognito.signin.user.admin`

### ✅ Etapa 2: Trocar Código por Token
**Problema**: Não usava autenticação Basic  
**Corrigido para**: 
- Header: `Authorization: Basic BASE64(client_id:client_secret)`
- URL: `https://auth.contaazul.com/oauth2/token`
- Método: `POST` com form-urlencoded

### ✅ Etapa 3: Renovar Token de Acesso
**Problema**: Mesmo as correções da Etapa 2 se aplicam  
**Lembre-se**: Sempre salvar o novo `refresh_token` após renovação

### ✅ Etapa 4: Fazer Chamadas na API
**Problema**: URL de usuário incorreta  
**Corrigido para**: `https://api-v2.contaazul.com/v1/pessoas`  
**Header**: `Authorization: Bearer {access_token}`

---

## 🧪 Teste Manual (Passo a Passo)

### Passo 1: Iniciar o Fluxo OAuth

```bash
# Frontend: Redirecionar o usuário para
http://localhost:3333/integrations/oauth/authorize?provider=conta-azul

# Ou via cURL (apenas para teste):
curl "http://localhost:3333/integrations/oauth/authorize?provider=conta-azul"
```

**O que acontece**:
- Sistema gera um `state` aleatório
- Redireciona para: `https://auth.contaazul.com/login?response_type=code&client_id=rsv1u7jeudn88nudu7fjicpqi&redirect_uri=http://localhost:3333/integrations/oauth/callback&state=...&scope=openid+profile+aws.cognito.signin.user.admin`

### Passo 2: Usuário Faz Login no Conta Azul
- Acesse a URL acima
- Faça login com sua conta do ERP Conta Azul
- Autorize o acesso
- Será redirecionado para: `http://localhost:3333/integrations/oauth/callback?code=XXXXX&state=XXXXX`

### Passo 3: Backend Processa o Callback
```bash
# O endpoint já está configurado para processar automaticamente
# Mas para teste, você pode chamar manualmente:

curl -X GET "http://localhost:3333/integrations/oauth/callback?provider=conta-azul&code=CODIGO_AQUI" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "success": true,
  "message": "Integration with conta-azul completed successfully",
  "integrationId": "clc123...",
  "providerUserId": "12345"
}
```

### Passo 4: Verificar Status da Integração
```bash
curl -X GET "http://localhost:3333/integrations/oauth/status?provider=conta-azul" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "connected": true,
  "provider": "conta-azul",
  "providerUserId": "12345",
  "connectedAt": "2025-12-11T12:00:00.000Z",
  "lastUpdated": "2025-12-11T12:00:00.000Z"
}
```

---

## 🔍 Testando Manualmente com cURL

### Teste Completo (Etapas 1-4)

#### 1️⃣ Simular Etapa 1 (Já feita pelo OAuth)
```bash
# O provider já faz isso:
echo "https://auth.contaazul.com/login?response_type=code&client_id=rsv1u7jeudn88nudu7fjicpqi&redirect_uri=http://localhost:3333/integrations/oauth/callback&state=abc123&scope=openid+profile+aws.cognito.signin.user.admin"
```

#### 2️⃣ Teste Etapa 2 (Trocar Código por Token) - MANUAL

```bash
# 1. Gere Base64 do seu client_id:client_secret
echo -n "rsv1u7jeudn88nudu7fjicpqi:dkodf3p5hefh7vrbacq2a3ruig4ogd6q3mdol4fpsomn0sb9imj" | base64
# Resultado: cnN2MXU3amV1ZG44bnVkdTdmamljcHFpOmRrb2RmM3A1aGVmaDd2cmJhY3EyYTNydWlnNG9nZDZxM21kb2w0ZnBzb21uMHNiOWltag==

# 2. Faça a requisição com o code do passo anterior
curl -X POST "https://auth.contaazul.com/oauth2/token" \
  -H "Authorization: Basic cnN2MXU3amV1ZG44bnVkdTdmamljcHFpOmRrb2RmM3A1aGVmaDd2cmJhY3EyYTNydWlnNG9nZDZxM21kb2w0ZnBzb21uMHNiOWltag==" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=CODIGO_RECEBIDO_DO_PASSO_1&grant_type=authorization_code&redirect_uri=http://localhost:3333/integrations/oauth/callback"
```

**Resposta esperada**:
```json
{
  "access_token": "eyJhbGc...",
  "expires_in": 3600,
  "refresh_token": "eyJhbGc...",
  "token_type": "Bearer"
}
```

#### 3️⃣ Teste Etapa 3 (Renovar Token)

```bash
curl -X POST "https://auth.contaazul.com/oauth2/token" \
  -H "Authorization: Basic cnN2MXU3amV1ZG44bnVkdTdmamljcHFpOmRrb2RmM3A1aGVmaDd2cmJhY3EyYTNydWlnNG9nZDZxM21kb2w0ZnBzb21uMHNiOWltag==" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "refresh_token=REFRESH_TOKEN_DO_PASSO_2&grant_type=refresh_token"
```

#### 4️⃣ Teste Etapa 4 (Fazer Chamadas na API)

```bash
curl -X GET "https://api-v2.contaazul.com/v1/pessoas" \
  -H "Authorization: Bearer ACCESS_TOKEN_DO_PASSO_2"
```

---

## 📋 Checklist de Validação

- [ ] **Etapa 1**: Autorização URL gera corretamente
- [ ] **Etapa 2**: Troca código por tokens com sucesso
- [ ] **Etapa 3**: Renovação de token funciona
- [ ] **Etapa 4**: API chama retorna dados do usuário
- [ ] **Banco de Dados**: Integração salva com tokens
- [ ] **Segurança**: Tokens não aparecem em logs
- [ ] **Refresh Automático**: Sistema renova tokens expirados

---

## 🐛 Troubleshooting

### Erro: "Invalid Redirect URI"
- ✅ Certifique-se que `CONTA_AZUL_REDIRECT_URI=http://localhost:3333/integrations/oauth/callback`
- ✅ Registre a mesma URL no Portal do Desenvolvedor Conta Azul

### Erro: "Invalid Client Credentials"
- ✅ Verifique `CONTA_AZUL_CLIENT_ID` e `CONTA_AZUL_CLIENT_SECRET`
- ✅ Confirme que estão Base64 corretos (se necessário)

### Erro: "Authorization Code Expired"
- ✅ Codes expiram rapidamente (geralmente em minutos)
- ✅ Teste o fluxo completo imediatamente após receber o code

### Erro: "User Not Found"
- ✅ Use uma conta real do ERP Conta Azul (não Portal)
- ✅ Verifique o endpoint da API `/v1/pessoas` vs `/v1/person`

---

## 🎯 Integração no Backend (Automática)

Todos esses passos já estão implementados! Basta usar:

```typescript
// Seu controller injeta OAuthService
constructor(private oauthService: OAuthService) {}

// Obter integração
const integration = await this.oauthService.getActiveIntegration(userId, 'conta-azul');

// Usar token
const accessToken = integration.accessToken;

// Token expirou? Renovar automaticamente
if (new Date() > integration.accessTokenExpiresAt) {
  await this.oauthService.refreshIntegrationToken(integration.id);
}
```

---

**Pronto para testar!** 🚀
