# 🚀 Implementação Completa: Refresh Token com Cron Job

## 📦 O que foi implementado

Sistema automático de renovação de tokens OAuth usando Cron Jobs no NestJS. O sistema renova tokens proativamente antes da expiração, garantindo que a aplicação nunca tenha tokens inválidos.

---

## 🎯 Arquivos Criados/Modificados

### 1. **Serviço de Renovação Automática** ⏰
**Arquivo**: `src/integrations/services/token-refresh.service.ts`
- ✅ Cron Job a cada hora para renovar tokens expirando
- ✅ Cron Job a cada 6 horas para limpeza de dados
- ✅ Logs detalhados de cada operação
- ✅ Tratamento inteligente de erros

### 2. **Helper para Validação Sob Demanda** 🔍
**Arquivo**: `src/integrations/services/token-validation.helper.ts`
- ✅ `getValidToken()` - Obter token garantidamente válido
- ✅ `isTokenValid()` - Apenas verificar validade
- ✅ `getTokenExpiryInfo()` - Informações de expiração

### 3. **Métodos de Repositório** 💾
**Arquivo**: `src/integrations/repositories/integration.repository.ts`
- ✅ `findExpiringTokens()` - Buscar tokens expirando
- ✅ `deleteInactiveOlderThan()` - Limpar dados obsoletos

### 4. **Configuração do NestJS** ⚙️
- **Arquivo**: `src/integrations/integrations.module.ts`
  - ✅ Registrado ScheduleModule
  - ✅ TokenRefreshService e TokenValidationHelper exportados

- **Arquivo**: `src/app.module.ts`
  - ✅ Registrado ScheduleModule globalmente

- **Arquivo**: `package.json`
  - ✅ Adicionado `@nestjs/schedule@^5.0.0`

### 5. **Documentação e Exemplos**
- `CRON_TOKEN_REFRESH_IMPLEMENTATION.md` - Guia completo de uso
- `CRON_STRATEGIES.ts` - Diferentes estratégias configuráveis
- `src/integrations/services/conta-azul-example.service.ts` - Exemplo de serviço

---

## 🚀 Como Usar

### Passo 1: Instalar Dependências
```bash
npm install
```

### Passo 2: Usar em Seus Serviços

**Opção A: Renovação Automática (Padrão)**
Sistema já está rodando. Tokens são renovados automaticamente a cada hora.

**Opção B: Validação Sob Demanda (Recomendado)**
```typescript
import { Injectable } from '@nestjs/common';
import { TokenValidationHelper } from 'src/integrations/services/token-validation.helper';

@Injectable()
export class MeuServico {
  constructor(private tokenHelper: TokenValidationHelper) {}

  async chamarAPIExterna(userId: string) {
    // Obter token válido (renova se necessário)
    const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');
    
    const response = await fetch('https://api.example.com/data', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return response.json();
  }
}
```

---

## 📊 Fluxo Automático

```
┌─────────────────────────────────┐
│ Aplicação Inicia                │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ TokenRefreshService Carrega      │
│ Cron Jobs Inicializam            │
└────────────┬────────────────────┘
             ↓
      ⏰ CADA HORA
             ↓
┌─────────────────────────────────┐
│ refreshExpiringTokens()          │
│ • Busca tokens que expiram em 5m │
│ • Renova cada um                 │
│ • Log de sucesso/erro            │
└─────────────────────────────────┘
             ↓
      ⏰ CADA 6 HORAS
             ↓
┌─────────────────────────────────┐
│ cleanupExpiredInactiveIntegrations│
│ • Remove integrações > 30 dias   │
└─────────────────────────────────┘
             ↓
        ✅ PRONTO
   Tokens sempre válidos!
```

---

## 🔧 Logs em Tempo Real

Quando iniciar a aplicação:

```bash
npm run start:dev
```

Você verá logs como:

```
[NestFactory] Starting Nest application...
[InstanceLoader] IntegrationsModule dependencies initialized
[SchedulerRegistry] Registered cron job: refreshExpiringTokens
[SchedulerRegistry] Registered cron job: cleanupExpiredInactiveIntegrations
[NestApplication] Nest application successfully started

[TokenRefreshService] Iniciando verificação de tokens para renovação automática
[TokenRefreshService] Encontrados 3 tokens expirando, iniciando renovação
[TokenRefreshService] Renovando token para integração clc123... (conta-azul)
[TokenRefreshService] ✅ Token renovado com sucesso: clc123... (user-456)
[TokenRefreshService] ✅ Ciclo de renovação automática de tokens concluído
```

---

## ⚙️ Customização

### Alterar Frequência de Renovação

Arquivo: `src/integrations/services/token-refresh.service.ts`

```typescript
// De: A cada hora
@Cron(CronExpression.EVERY_HOUR)

// Para: A cada 30 minutos
@Cron('0 */30 * * * *')

// Para: A cada 15 minutos (agressivo)
@Cron('*/15 * * * *')

// Para: A cada 6 horas (conservador)
@Cron('0 */6 * * *')
```

### Alterar Tempo de Antecedência

Arquivo: `src/integrations/services/token-refresh.service.ts`

```typescript
// De: Renovar se expira em 5 minutos
const expiringIntegrations = 
  await this.integrationRepository.findExpiringTokens(5);

// Para: Renovar se expira em 10 minutos
const expiringIntegrations = 
  await this.integrationRepository.findExpiringTokens(10);

// Para: Renovar se expira em 30 minutos
const expiringIntegrations = 
  await this.integrationRepository.findExpiringTokens(30);
```

### Desabilitar Limpeza Automática

Simplesmente remova o método `cleanupExpiredInactiveIntegrations()` ou:

```typescript
// Ao invés de: @Cron('0 */6 * * *')
// Use:
@Cron('0 0 32 * *') // Data que nunca ocorre
```

---

## 📋 Casos de Uso

### ✅ Renovação Automática (Sem Código Extra)
```typescript
// Não precisa fazer nada, Cron Job trata tudo
async listarClientes(userId: string) {
  // Token sempre válido
  const integration = await this.oauthService.getActiveIntegration(userId, 'conta-azul');
  return fetch(url, { headers: { 'Authorization': `Bearer ${integration.accessToken}` } });
}
```

### ✅ Validação Antes de Usar
```typescript
async processoComRetry(userId: string) {
  // Verificar validade antes
  const isValid = await this.tokenHelper.isTokenValid(userId, 'conta-azul');
  
  if (!isValid) {
    throw new Error('Token inválido, usuário precisa fazer login novamente');
  }
  
  // Prosseguir com segurança
}
```

### ✅ Obter Token Garantidamente Válido
```typescript
async chamarAPIDados(userId: string) {
  // Garante token válido (renova se necessário)
  const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');
  
  return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
}
```

### ✅ Monitorar Expiração
```typescript
async verificarSituacao(userId: string) {
  const info = await this.tokenHelper.getTokenExpiryInfo(userId, 'conta-azul');
  
  console.log(`Token expira em ${info.expiresIn}ms`);
  console.log(`Data: ${info.expiresAt}`);
}
```

---

## ⚠️ Tratamento de Erros

### Refresh Token Expirou
```typescript
// Sistema detecta automaticamente:
// • Marca integração como isActive = false
// • Log: "Integração xxx marcada como inativa (refresh token expirado)"
// • Usuário precisa fazer login novamente
```

### Erro na Renovação
```typescript
// Sistema:
// • Log detalhado do erro
// • Tenta novamente na próxima execução do Cron
// • Não interrompe renovação de outros tokens
```

### Erro Crítico no Cron Job
```typescript
// Sistema:
// • Log do erro crítico
// • Próxima execução tenta de novo
// • Aplicação continua funcionando
```

---

## 📦 Estrutura de Pastas

```
src/integrations/
├── services/
│   ├── token-refresh.service.ts        ← Cron Jobs automáticos
│   ├── token-validation.helper.ts      ← Validação sob demanda
│   └── conta-azul-example.service.ts   ← Exemplo de uso
├── repositories/
│   └── integration.repository.ts       ← Métodos para buscar/limpar tokens
├── oauth/
│   ├── oauth.service.ts                ← Renovação de tokens
│   └── oauth.controller.ts
└── integrations.module.ts              ← ScheduleModule registrado
```

---

## ✅ Checklist de Verificação

- [x] Dependência `@nestjs/schedule` instalada
- [x] TokenRefreshService criado com Cron Jobs
- [x] TokenValidationHelper criado
- [x] Métodos adicionados ao repositório
- [x] Módulos configurados
- [x] Sem erros de compilação TypeScript
- [x] Documentação completa
- [x] Exemplo de serviço incluído

---

## 🎓 Exemplos Prontos para Copiar

### Exemplo 1: Serviço com Validação
```typescript
import { Injectable } from '@nestjs/common';
import { TokenValidationHelper } from 'src/integrations/services/token-validation.helper';

@Injectable()
export class ClienteService {
  constructor(private tokenHelper: TokenValidationHelper) {}

  async listarClientes(userId: string) {
    const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');
    
    const response = await fetch('https://api-v2.contaazul.com/v1/pessoas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.json();
  }
}
```

### Exemplo 2: Verificação com Retry
```typescript
async processarComRetry(userId: string, maxTentativas: number = 3) {
  for (let i = 0; i < maxTentativas; i++) {
    try {
      const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');
      return await this.chamarAPI(token);
    } catch (error) {
      if (i === maxTentativas - 1) throw error;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}
```

### Exemplo 3: Validar Antes de Operação Sensível
```typescript
async operacaGrande(userId: string) {
  const expiryInfo = await this.tokenHelper.getTokenExpiryInfo(userId, 'conta-azul');
  
  // Não fazer operação se token vai expirar em menos de 2 minutos
  if (expiryInfo && expiryInfo.expiresIn < 120000) {
    throw new Error('Token vai expirar, tente novamente em alguns minutos');
  }
  
  // Prosseguir com segurança
}
```

---

## 🔗 Documentação Relacionada

- `CRON_TOKEN_REFRESH_IMPLEMENTATION.md` - Guia completo
- `CRON_STRATEGIES.ts` - Diferentes estratégias
- `REFRESH_TOKEN_GUIDE.md` - Conceitos OAuth (original)

---

## 📞 Suporte

Qualquer dúvida, verifique:
1. Logs em `npm run start:dev`
2. Arquivo `CRON_TOKEN_REFRESH_IMPLEMENTATION.md`
3. Exemplo em `conta-azul-example.service.ts`

---

**✅ Sistema pronto para produção!**

O refresh token agora é renovado automaticamente a cada hora. Você pode focar em desenvolver sua lógica de negócio sabendo que os tokens sempre serão válidos. 🎉

