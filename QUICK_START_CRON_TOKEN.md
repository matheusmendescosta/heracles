# 🚀 Quick Start - Refresh Token com Cron Job

## ⚡ Em 2 minutos

### 1. Instalar
```bash
npm install
```

### 2. Pronto! ✅
O sistema de renovação automática já está rodando. Nenhuma configuração adicional necessária.

---

## 🎯 Usar em Seus Serviços

### Opção A: Simplesmente Usar (Mais Simples)
```typescript
async minhaOperacao(userId: string) {
  // O Cron Job já garante que o token é válido
  const integration = await this.oauthService.getActiveIntegration(userId, 'conta-azul');
  const token = integration.accessToken;
  
  return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
}
```

### Opção B: Validar Antes (Recomendado)
```typescript
import { TokenValidationHelper } from 'src/integrations/services/token-validation.helper';

@Injectable()
export class MeuServico {
  constructor(private tokenHelper: TokenValidationHelper) {}

  async minhaOperacao(userId: string) {
    // Garante que o token é válido (renova se necessário)
    const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');
    
    return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  }
}
```

---

## 📊 Como Funciona

```
Hora 00:00 → Cron Job executa → Busca tokens que expiram em 5 min → Renova todos
Hora 01:00 → Cron Job executa → Busca tokens que expiram em 5 min → Renova todos
Hora 02:00 → Cron Job executa → Busca tokens que expiram em 5 min → Renova todos
...
A cada 6 horas → Limpeza de integrações inativas > 30 dias
```

---

## 📝 Exemplos Prontos

### 1. Listar Clientes
```typescript
async listarClientes(userId: string) {
  const token = await this.tokenHelper.getValidToken(userId, 'conta-azul');
  const res = await fetch('https://api-v2.contaazul.com/v1/pessoas', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}
```

### 2. Verificar Token Antes
```typescript
async operacaoSegura(userId: string) {
  const isValid = await this.tokenHelper.isTokenValid(userId, 'conta-azul');
  if (!isValid) {
    throw new Error('Token inválido');
  }
  // Fazer algo...
}
```

### 3. Informações de Expiração
```typescript
async verificarStatus(userId: string) {
  const info = await this.tokenHelper.getTokenExpiryInfo(userId, 'conta-azul');
  console.log(`Expira em: ${info.expiresIn}ms`);
}
```

---

## 🔍 Ver Logs

```bash
npm run start:dev
```

Procure por logs como:
```
[TokenRefreshService] ✅ Token renovado com sucesso: clc123...
[TokenRefreshService] ✅ Ciclo de renovação automática de tokens concluído
```

---

## ⚙️ Customização Rápida

### Mudar Frequência de Renovação

Arquivo: `src/integrations/services/token-refresh.service.ts`

**Linha 24:**
```typescript
// De: @Cron(CronExpression.EVERY_HOUR)
// Para: @Cron('*/30 * * * *') // A cada 30 minutos
```

### Mudar Tempo de Antecedência

**Linha 29:**
```typescript
// De: await this.integrationRepository.findExpiringTokens(5);
// Para: await this.integrationRepository.findExpiringTokens(15); // 15 minutos
```

---

## 📚 Documentação Completa

- `IMPLEMENTACAO_CRON_TOKEN_REFRESH.md` - Guia completo com todos os detalhes
- `CRON_TOKEN_REFRESH_IMPLEMENTATION.md` - Documentação técnica detalhada
- `CRON_STRATEGIES.ts` - Diferentes estratégias disponíveis
- `src/integrations/services/conta-azul-example.service.ts` - Exemplo funcional completo

---

## ✅ Arquivos Criados

```
✓ src/integrations/services/token-refresh.service.ts
✓ src/integrations/services/token-validation.helper.ts
✓ src/integrations/services/conta-azul-example.service.ts
✓ IMPLEMENTACAO_CRON_TOKEN_REFRESH.md
✓ CRON_TOKEN_REFRESH_IMPLEMENTATION.md
✓ CRON_STRATEGIES.ts
✓ QUICK_START_CRON_TOKEN.md (este arquivo)
```

---

## 📋 Checklist

- [x] Dependências instaladas (`@nestjs/schedule`)
- [x] TokenRefreshService rodando com Cron Jobs
- [x] TokenValidationHelper disponível
- [x] Exemplo de serviço pronto
- [x] Documentação completa
- [x] Sem erros de compilação

---

## 🎉 Pronto!

Seu sistema de refresh token com Cron Job está **100% operacional**.

**Próximo passo**: Abra um dos arquivos `.ts` criados e comece a usar! 🚀

