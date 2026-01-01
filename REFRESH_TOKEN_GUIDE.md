# 🔄 Como Funciona o Refresh Token (OAuth Conta Azul)

## 📚 Conceitos Básicos

### **O Problema:**
- **Access Token** expira em 1 hora (3600 segundos)
- Sem ele, você não consegue fazer chamadas na API Conta Azul
- Você não quer forçar o usuário fazer login de novo

### **A Solução:**
- **Refresh Token** é um token de vida longa que permite renovar o **Access Token**
- Quando o Access Token expira, você usa o Refresh Token para obter um novo
- É como ter uma "chave mestre" que gera novas chaves temporárias

---

## 🏗️ Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 1: Login no Conta Azul (Você já fez isso)           │
└─────────────────────────────────────────────────────────────┘
                          ↓
API Recebe do Conta Azul:
  ✅ access_token (expira em 1 hora)
  ✅ refresh_token (expira em dias/meses)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 2: Salvar no Banco de Dados                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
Tabela Integration:
  {
    accessToken: "eyJhbGc...",
    refreshToken: "eyJhbGc...",
    accessTokenExpiresAt: "2025-12-11T13:15:00Z",
    isActive: true
  }
                          ↓
                    ⏰ 1 HORA PASSA ⏰
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 3: Detectar Expiração (Quando você vai usar)        │
└─────────────────────────────────────────────────────────────┘
                          ↓
Sistema verifica:
  • accessTokenExpiresAt < Data atual?
  • SIM → Precisa renovar!
  • NÃO → Pode usar normalmente
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 4: Renovar com Refresh Token                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
API envia ao Conta Azul:
  POST https://auth.contaazul.com/oauth2/token
  Authorization: Basic BASE64(client_id:client_secret)
  refresh_token=xxxx
                          ↓
Conta Azul responde:
  {
    access_token: "eyJhbGc...", (NOVO!)
    refresh_token: "eyJhbGc...", (PODE SER NOVO)
    expires_in: 3600
  }
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 5: Atualizar no Banco                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
UPDATE Integration SET:
  accessToken = novo_token,
  refreshToken = novo_refresh_token,
  accessTokenExpiresAt = agora + 1 hora
                          ↓
✅ PRONTO! Token renovado, sistema continua funcionando
```

---

## 🔐 O que está Salvo no Banco?

```typescript
// Tabela: Integration
{
  id: "clc123...",
  userId: "user-123",
  provider: "conta-azul",
  providerUserId: "12345",
  
  // Tokens OAuth
  accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",  // 1 hora de vida
  refreshToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", // Vida longa
  accessTokenExpiresAt: "2025-12-11T13:15:00Z",             // Quando expira
  
  isActive: true,
  createdAt: "2025-12-11T12:00:00Z",
  updatedAt: "2025-12-11T12:00:00Z"
}
```

---

## 🔧 Como Implementar (Backend)

### **Cenário: Você quer fazer uma chamada na API Conta Azul**

```typescript
// seu-service.ts
import { OAuthService } from 'src/integrations/oauth/oauth.service';

@Injectable()
export class MinhaServico {
  constructor(private oauthService: OAuthService) {}

  async buscarDadosDaContaAzul(userId: string) {
    // 1. Obter integração ativa
    const integration = await this.oauthService.getActiveIntegration(
      userId,
      'conta-azul'
    );

    if (!integration) {
      throw new Error('Usuário não tem Conta Azul integrada');
    }

    // 2. Verificar se token expirou
    const agora = new Date();
    if (agora > integration.accessTokenExpiresAt) {
      // Token expirou! Renovar
      await this.oauthService.refreshIntegrationToken(integration.id);
      
      // Buscar novamente após renovação
      const integrationAtualizada = await this.oauthService.getActiveIntegration(
        userId,
        'conta-azul'
      );
      
      // Usar token atualizado
      return this.chamarAPIContaAzul(integrationAtualizada.accessToken);
    }

    // 3. Token ainda é válido, usar normalmente
    return this.chamarAPIContaAzul(integration.accessToken);
  }

  private async chamarAPIContaAzul(accessToken: string) {
    const response = await fetch('https://api-v2.contaazul.com/v1/pessoas', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }
}
```

---

## 🤖 Renovação Automática (Implementar depois)

**Opção 1: Renovar Sob Demanda (Como acima)**
- ✅ Simples
- ✅ Seguro
- ❌ Usuário espera renovação ocorrer

**Opção 2: Renovar Agendado (Cron Job)**
```typescript
// integrations.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TokenRefreshService]
})
export class IntegrationsModule {}

// token-refresh.service.ts
@Injectable()
export class TokenRefreshService {
  @Cron('0 * * * *') // A cada hora
  async refreshExpiringTokens() {
    // Buscar todas integrações que vão expirar em 5 minutos
    const expiring = await this.integrationRepository.findExpiring(5);
    
    for (const integration of expiring) {
      try {
        await this.oauthService.refreshIntegrationToken(integration.id);
      } catch (error) {
        console.error(`Erro ao renovar ${integration.id}:`, error);
      }
    }
  }
}
```

**Opção 3: Renovar Antes de Usar (Middleware)**
```typescript
// interceptor.ts
@Injectable()
export class TokenRefreshInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    // Renovar antes de cada requisição (mais seguro)
    return this.oauthService.ensureValidToken(userId).pipe(
      switchMap(() => next.handle())
    );
  }
}
```

---

## 💾 Banco de Dados - O que Muda?

### **Na Integração Inicial:**
```sql
INSERT INTO Integration (...) VALUES (
  'user-123',
  'conta-azul',
  'eyJhbGc...', -- access_token inicial
  'eyJyZW...', -- refresh_token (salvo!)
  '2025-12-11T13:15:00Z',
  true
);
```

### **Após Renovação (1 hora depois):**
```sql
UPDATE Integration SET
  accessToken = 'eyJhbGc...NOVO', -- ← Atualizado
  refreshToken = 'eyJyZW...NOVO', -- ← Pode ser atualizado tb
  accessTokenExpiresAt = '2025-12-11T14:15:00Z', -- ← +1 hora
  updatedAt = '2025-12-11T13:15:00Z'
WHERE id = 'clc123...';
```

---

## ⚠️ Casos Especiais

### **Refresh Token também expira?**

Sim, mas com vida muito mais longa:
- **Access Token**: 1 hora
- **Refresh Token**: 7-30 dias (depende do Conta Azul)

Se o refresh token também expirar:
- ❌ Não consegue renovar mais
- ✅ Usuário precisa fazer login novamente

```typescript
// Verificar se refresh token expirou
if (integrationAtualizada.refreshTokenExpiresAt < new Date()) {
  throw new Error('Integração expirou. Faça login novamente.');
}
```

### **Refresh Token é revogado pelo usuário?**

Se o usuário desautor da integração no Conta Azul:
```typescript
// Conta Azul retorna erro 401
const error = {
  error: 'invalid_grant',
  error_description: 'The provided authorization grant is invalid...'
}

// Você pode:
// 1. Marcar integração como inativa
await this.integrationRepository.toggleActive(integrationId, false);

// 2. Notificar usuário para reconectar
sendEmail(userId, 'Integração Conta Azul expirou, refaça o login');
```

---

## 📊 Resumo de Tempos

```
┌─────────────────────────────────────────────────┐
│  Access Token (Curta vida)                      │
│  ├─ Validade: 1 hora (3600 segundos)           │
│  ├─ Uso: Chamadas na API Conta Azul            │
│  └─ Renova com: Refresh Token                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Refresh Token (Longa vida)                     │
│  ├─ Validade: ~7-30 dias                       │
│  ├─ Uso: Renovar o Access Token                │
│  └─ Quando expira: Usuário faz login novamente │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Resumo para Implementar

### **O que já está pronto:**
✅ Salvar tokens no banco  
✅ Método para renovar token  
✅ Verificar se integração está ativa  

### **O que você precisa fazer:**
1. **Antes de usar o token**, verificar se expirou
2. **Se expirou**, chamar `oauthService.refreshIntegrationToken()`
3. **Usar o novo token** nas requisições à API Conta Azul

### **Código Pronto para Copiar:**

```typescript
// helper.ts
export async function getValidToken(
  userId: string,
  oauthService: OAuthService
): Promise<string> {
  const integration = await oauthService.getActiveIntegration(
    userId,
    'conta-azul'
  );

  if (!integration) {
    throw new Error('Integração não encontrada');
  }

  // Se expirou, renovar
  if (new Date() > integration.accessTokenExpiresAt) {
    await oauthService.refreshIntegrationToken(integration.id);
    
    // Buscar token atualizado
    const updated = await oauthService.getActiveIntegration(
      userId,
      'conta-azul'
    );
    return updated.accessToken;
  }

  return integration.accessToken;
}

// Usar em qualquer lugar:
const token = await getValidToken(userId, this.oauthService);
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

**Resumo Final:** O refresh token é como um "passe de vida longa" que permite renovar seu "cartão de acesso" sempre que expirar, sem precisar fazer login de novo! 🎫

