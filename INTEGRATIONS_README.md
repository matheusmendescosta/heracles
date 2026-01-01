# Integrations Module - OAuth 2.0 Genérico

## 📋 Visão Geral

Módulo genérico para gerenciar integrações OAuth 2.0 com múltiplos provedores. Atualmente suporta **Conta Azul**, mas facilmente extensível para novos provedores.

## 🏗️ Arquitetura

```
src/integrations/
├── integrations.module.ts          # Módulo principal
├── oauth/
│   ├── oauth.service.ts            # Lógica centralizada OAuth
│   ├── oauth.controller.ts         # Endpoints HTTP
│   └── interfaces/
│       └── oauth-provider.interface.ts  # Interface padrão
├── providers/
│   ├── example.provider.ts         # Template para novos provedores
│   └── conta-azul/
│       └── conta-azul.provider.ts  # Implementação Conta Azul
└── repositories/
    └── integration.repository.ts   # Acesso ao banco de dados
```

## 🔌 Endpoints Disponíveis

### 1. **Iniciar Autenticação**
```
GET /integrations/oauth/authorize?provider=conta-azul
```

Redireciona o usuário para o login do provedor.

**Resposta**: Redirecionamento HTTP 302 para `https://api.contaazul.com/oauth/authorize?...`

---

### 2. **Callback de Autenticação**
```
GET /integrations/oauth/callback?provider=conta-azul&code=xxx&state=xxx
Authorization: Bearer {JWT}
```

Processa o código de autorização e salva a integração.

**Resposta**:
```json
{
  "success": true,
  "message": "Integration with conta-azul completed successfully",
  "integrationId": "clc123...",
  "providerUserId": "12345"
}
```

---

### 3. **Verificar Status da Integração**
```
GET /integrations/oauth/status?provider=conta-azul
Authorization: Bearer {JWT}
```

Verifica se o usuário tem uma integração ativa.

**Resposta**:
```json
{
  "connected": true,
  "provider": "conta-azul",
  "providerUserId": "12345",
  "connectedAt": "2025-12-11T12:00:00.000Z",
  "lastUpdated": "2025-12-11T12:00:00.000Z"
}
```

## 🔑 Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Conta Azul OAuth
CONTA_AZUL_CLIENT_ID=seu_client_id
CONTA_AZUL_CLIENT_SECRET=seu_client_secret
CONTA_AZUL_REDIRECT_URI=http://localhost:3000/integrations/oauth/callback
```

## 🚀 Como Usar

### 1. **Frontend: Iniciar Login**

```javascript
// Redireciona para autorização
window.location.href = '/integrations/oauth/authorize?provider=conta-azul';
```

### 2. **Backend Recebe Callback**

O `OAuthController` processa automaticamente:
- ✅ Troca o código por tokens
- ✅ Busca informações do usuário
- ✅ Salva integração no banco
- ✅ Retorna confirmação

### 3. **Usar a Integração**

```typescript
// Injetar OAuthService
constructor(private oauthService: OAuthService) {}

// Obter integração ativa
const integration = await this.oauthService.getActiveIntegration(
  userId,
  'conta-azul'
);

// Acessar token
const accessToken = integration.accessToken;

// Token expirado? Renovar automaticamente
if (new Date() > integration.accessTokenExpiresAt) {
  await this.oauthService.refreshIntegrationToken(integration.id);
}
```

## ➕ Adicionar Novo Provedor

### Passo 1: Criar Novo Provider

```typescript
// src/integrations/providers/seu-provider/seu.provider.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider } from '../../oauth/interfaces/oauth-provider.interface';

@Injectable()
export class SeuProvider implements OAuthProvider {
  name = 'seu-provider';
  clientId: string;
  clientSecret: string;
  redirectUri: string;

  constructor(config: ConfigService) {
    this.clientId = config.get('SEU_PROVIDER_CLIENT_ID');
    this.clientSecret = config.get('SEU_PROVIDER_CLIENT_SECRET');
    this.redirectUri = config.get('SEU_PROVIDER_REDIRECT_URI');
  }

  getAuthorizationUrl(state: string): string {
    // Implementar
  }

  async exchangeCodeForToken(code: string) {
    // Implementar
  }

  async refreshAccessToken(refreshToken: string) {
    // Implementar
  }

  async getUserInfo(accessToken: string) {
    // Implementar
  }
}
```

### Passo 2: Registrar Provider no Serviço

```typescript
// src/integrations/oauth/oauth.service.ts
constructor(
  ...
  private seuProvider: SeuProvider,
) {
  this.registerProviders();
}

private registerProviders() {
  this.providers.set('conta-azul', this.contaAzulProvider);
  this.providers.set('seu-provider', this.seuProvider);  // ← Adicionar
}
```

### Passo 3: Adicionar ao Módulo

```typescript
// src/integrations/integrations.module.ts
@Module({
  controllers: [OAuthController],
  providers: [
    OAuthService,
    IntegrationRepository,
    ContaAzulProvider,
    SeuProvider,  // ← Adicionar
  ],
})
```

### Passo 4: Adicionar Variáveis de Ambiente

```env
SEU_PROVIDER_CLIENT_ID=xxx
SEU_PROVIDER_CLIENT_SECRET=xxx
SEU_PROVIDER_REDIRECT_URI=http://localhost:3000/integrations/oauth/callback
```

## 📊 Modelo de Dados

```prisma
model Integration {
  id String @id @default(cuid())
  userId String                    # Usuário que conectou
  user User @relation(...)
  
  provider String                  # "conta-azul", "stripe", etc
  providerUserId String            # ID no provedor externo
  
  accessToken String               # Token ativo
  refreshToken String?             # Para renovação
  accessTokenExpiresAt DateTime    # Quando expira
  
  metadata Json?                   # Dados extras do provedor
  isActive Boolean @default(true) # Ativação/desativação
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, provider])    # Um user, um provider
  @@index([provider])
}
```

## 🔄 Refresh Automático de Tokens

O sistema detecta tokens expirados e os renova automaticamente quando necessário:

```typescript
// OAuthService cuida disso
await this.oauthService.refreshIntegrationToken(integrationId);
```

## 🛡️ Segurança

- ✅ Tokens armazenados no banco (não em localStorage)
- ✅ `refreshToken` pode ser criptografado (configurar conforme necessário)
- ✅ Suporte a `state` parameter para prevenir CSRF
- ✅ Requer autenticação JWT para acessar endpoints

## 📝 Próximos Passos

- [ ] Adicionar encriptação para refresh tokens
- [ ] Implementar webhook para eventos de revogação
- [ ] Criar endpoint para desconectar integração
- [ ] Adicionar suporte a Stripe, Shopify, etc
- [ ] Testes unitários e de integração

---

**Dúvidas?** Consulte a documentação do provedor específico ou abra uma issue!
