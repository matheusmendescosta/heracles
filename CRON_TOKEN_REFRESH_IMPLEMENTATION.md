## 🔄 Sistema de Refresh Token com Cron Job - Implementação

Implementação completa de renovação automática de tokens OAuth usando agendamento com Cron Jobs no NestJS.

---

## 📋 O que foi implementado

### 1. **TokenRefreshService** - Renovação Automática Agendada
Local: `src/integrations/services/token-refresh.service.ts`

#### Cron Jobs Automáticos:

**🕐 A cada hora (00:00, 01:00, 02:00...)**
```typescript
@Cron(CronExpression.EVERY_HOUR)
async refreshExpiringTokens()
```
- ✅ Encontra todas as integrações que vão expirar em 5 minutos
- ✅ Renova proativamente antes da expiração
- ✅ Mantém registro detalhado em logs
- ✅ Se o refresh token também expirou, marca integração como inativa

**🧹 A cada 6 horas (00:00, 06:00, 12:00, 18:00)**
```typescript
@Cron('0 */6 * * *')
async cleanupExpiredInactiveIntegrations()
```
- ✅ Remove integrações inativas com mais de 30 dias
- ✅ Limpeza automática do banco de dados

---

### 2. **TokenValidationHelper** - Validação Sob Demanda
Local: `src/integrations/services/token-validation.helper.ts`

Use quando precisa fazer uma requisição e quer garantir que o token é válido:

```typescript
// Em qualquer serviço que faça chamadas à API Conta Azul
@Injectable()
export class MeuServico {
  constructor(private tokenHelper: TokenValidationHelper) {}

  async buscarDados(userId: string) {
    // Obter token válido (renova se necessário)
    const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');
    
    const response = await fetch('https://api-v2.contaazul.com/v1/pessoas', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.json();
  }
}
```

---

### 3. **Métodos no IntegrationRepository**
Local: `src/integrations/repositories/integration.repository.ts`

#### `findExpiringTokens(minutesUntilExpiry: number)`
```typescript
// Buscar integrações que expiram em 5 minutos
const expiringIntegrations = await this.integrationRepository.findExpiringTokens(5);
```

#### `deleteInactiveOlderThan(beforeDate: Date)`
```typescript
// Remover integrações inativas criadas antes de uma data
const result = await this.integrationRepository.deleteInactiveOlderThan(thirtyDaysAgo);
```

---

## 🚀 Como Usar

### Opção 1: Renovação Automática (Padrão)
O sistema já está configurado para renovar automaticamente. Não precisa fazer nada além de:

1. **Adicione a dependência**:
```bash
npm install @nestjs/schedule
```

2. **Pronto!** O Cron Job está rodando automaticamente

### Opção 2: Renovação Sob Demanda (Recomendado para APIs)
Use antes de fazer requisições à API externa:

```typescript
import { Injectable } from '@nestjs/common';
import { TokenValidationHelper } from 'src/integrations/services/token-validation.helper';

@Injectable()
export class ContaAzulService {
  constructor(private tokenHelper: TokenValidationHelper) {}

  async listarClientes(userId: string) {
    // Garante que o token é válido (renova se necessário)
    const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');

    const response = await fetch('https://api-v2.contaazul.com/v1/pessoas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.json();
  }

  async verificarEstoqueQuando(userId: string) {
    // Verificar sem renovar (apenas validar)
    const isValid = await this.tokenHelper.isTokenValid(userId, 'conta-azul');
    
    if (!isValid) {
      throw new Error('Token inválido, usuário precisa fazer login novamente');
    }

    // Continuar com operação...
  }

  async obterInfoExpiração(userId: string) {
    const info = await this.tokenHelper.getTokenExpiryInfo(userId, 'conta-azul');
    
    if (info) {
      console.log(`Token expira em ${info.expiresIn}ms`);
      console.log(`Data de expiração: ${info.expiresAt}`);
    }
  }
}
```

---

## 📊 Fluxo Completo

```
┌──────────────────────────────────────────────────────────┐
│  1️⃣  Sistema inicia                                       │
│      TokenRefreshService é carregado                      │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  2️⃣  Cada hora (Cron Job dispara)                        │
│      - Busca todas integrações que expiram em 5 min      │
│      - Renova cada uma proativamente                      │
│      - Log detalhado de sucesso/erro                     │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  3️⃣  Quando você quer usar um token                       │
│      MeuServico → TokenValidationHelper.getValidToken()  │
│      - Se válido: retorna token                          │
│      - Se expirado: renova primeiro, depois retorna      │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  4️⃣  A cada 6 horas (Limpeza)                            │
│      - Remove integrações inativas > 30 dias             │
│      - Libera espaço no banco de dados                   │
└──────────────────────────────────────────────────────────┘
```

---

## 🔍 Monitorando Cron Jobs

### Ver logs em tempo real:

```bash
# Terminal 1: Iniciar aplicação em dev
npm run start:dev

# Você verá logs como:
[TokenRefreshService] Iniciando verificação de tokens para renovação automática
[TokenRefreshService] Encontrados 3 tokens expirando, iniciando renovação
[TokenRefreshService] ✅ Token renovado com sucesso: clc123... (user-456)
[TokenRefreshService] ✅ Ciclo de renovação automática de tokens concluído
```

### Customizar frequência dos Cron Jobs

Abra `src/integrations/services/token-refresh.service.ts`:

```typescript
// Mudar renovação de "a cada hora" para "a cada 30 minutos"
@Cron('0 */30 * * * *') // A cada 30 minutos
async refreshExpiringTokens(): Promise<void> {
  // ...
}

// Mudar limpeza de "a cada 6 horas" para "diariamente"
@Cron('0 0 * * *') // 00:00 todo dia
async cleanupExpiredInactiveIntegrations(): Promise<void> {
  // ...
}
```

#### Expressões Cron Comuns:
```typescript
// Predefinidas no NestJS
CronExpression.EVERY_SECOND      // A cada segundo
CronExpression.EVERY_10_SECONDS  // A cada 10 segundos
CronExpression.EVERY_30_SECONDS  // A cada 30 segundos
CronExpression.EVERY_MINUTE      // A cada minuto
CronExpression.EVERY_10_MINUTES  // A cada 10 minutos
CronExpression.EVERY_30_MINUTES  // A cada 30 minutos
CronExpression.EVERY_HOUR        // A cada hora (usado no projeto)
CronExpression.EVERY_DAY         // Todo dia às 00:00

// Formato customizado (padrão cron)
'0 0 * * *'           // 00:00 todo dia
'0 */6 * * *'         // A cada 6 horas
'0 9 * * MON'         // 09:00 toda segunda-feira
'*/5 * * * *'         // A cada 5 minutos
'0 0 1 * *'           // Primeiro dia do mês às 00:00
```

---

## ⚠️ Tratamento de Erros

O sistema foi projetado para ser robusto:

### 1. Se refresh token também expirou
```typescript
// Marca integração como inativa
// Usuário precisa fazer login novamente
await this.integrationRepository.toggleActive(integration.id, false);
```

### 2. Se a renovação falha
```typescript
// Log detalhado do erro
// Tenta renovar novamente na próxima execução do Cron
// Não interrompe processamento de outras integrações
```

### 3. Se há erro crítico no Cron Job
```typescript
// Log do erro crítico
// Próxima execução tenta de novo em 1 hora
```

---

## 📦 Dependências Adicionadas

```json
{
  "@nestjs/schedule": "^4.0.1"
}
```

Instale com:
```bash
npm install
```

---

## ✅ Checklist de Implementação

- [x] TokenRefreshService criado com Cron Jobs
- [x] TokenValidationHelper criado para validação sob demanda
- [x] Métodos adicionados ao IntegrationRepository
- [x] IntegrationsModule atualizado com ScheduleModule
- [x] AppModule atualizado com ScheduleModule global
- [x] package.json atualizado com @nestjs/schedule
- [x] Documentação criada

---

## 🎯 Próximos Passos

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Use em seus serviços**:
   ```typescript
   constructor(private tokenHelper: TokenValidationHelper) {}
   ```

3. **Verifique os logs** quando a aplicação iniciar:
   ```
   [TokenRefreshService] Iniciando verificação de tokens para renovação automática
   ```

4. **Customize frequências** conforme necessário

---

## 🔗 Referências

- Documentação NestJS Schedule: https://docs.nestjs.com/techniques/task-scheduling
- Expressões Cron: https://crontab.guru/
- JWT Refresh Token Pattern: https://tools.ietf.org/html/rfc6749#section-6

