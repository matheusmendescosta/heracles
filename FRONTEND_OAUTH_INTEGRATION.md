# 🚀 Guia de Integração OAuth no Frontend

## 📋 Resumo do Fluxo

```
Frontend → Redireciona para API (authorize) 
  ↓
API → Redireciona para Conta Azul 
  ↓
Usuário → Faz login no Conta Azul 
  ↓
Conta Azul → Redireciona para API com código 
  ↓
API → Troca código por token (salva no BD) 
  ↓
Frontend → Token integrado! ✅
```

---

## 🎯 Endpoints Disponíveis

### 1️⃣ **GET /integrations/oauth/authorize**
**Responsável por**: Redirecionar o usuário para a tela de login do Conta Azul

```typescript
// URL no Frontend
const authorizeUrl = `http://localhost:3333/integrations/oauth/authorize?provider=conta-azul`;

// Quando clicado, redireciona para:
window.location.href = authorizeUrl;
```

**Parâmetros Query**:
- `provider`: Nome do provedor (ex: `conta-azul`)

**Resposta**: Redireciona (302) para a URL de autorização do Conta Azul

---

### 2️⃣ **GET /integrations/oauth/callback**
**Responsável por**: Receber o código de autorização e trocar por token

```typescript
// ⚠️ IMPORTANTE: Esse endpoint é chamado AUTOMATICAMENTE pelo Conta Azul
// Você NÃO precisa chamá-lo manualmente

// Conta Azul redireciona para:
// http://localhost:3333/integrations/oauth/callback?provider=conta-azul&code=XXXXX&state=XXXXX

// Você pode redirecionar o usuário após para uma página de sucesso
```

**Parâmetros Query**:
- `provider`: Nome do provedor
- `code`: Código de autorização do Conta Azul
- `state`: Token de segurança

**Headers Necessários**:
```
Authorization: Bearer {JWT_TOKEN_DO_SEU_USUARIO}
```

**Resposta Esperada** (200 OK):
```json
{
  "success": true,
  "message": "Integration with conta-azul completed successfully",
  "integrationId": "clc123...",
  "providerUserId": "12345"
}
```

⚠️ **Importante**: O usuário PRECISA estar autenticado (ter um JWT válido) quando o callback é chamado!

---

### 3️⃣ **GET /integrations/oauth/status**
**Responsável por**: Verificar se a integração está ativa

```typescript
// Chamada do Frontend
const response = await fetch(
  'http://localhost:3333/integrations/oauth/status?provider=conta-azul',
  {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  }
);

const status = await response.json();
```

**Parâmetros Query**:
- `provider`: Nome do provedor

**Headers Necessários**:
```
Authorization: Bearer {JWT_TOKEN_DO_SEU_USUARIO}
```

**Resposta Esperada** (se conectado):
```json
{
  "connected": true,
  "provider": "conta-azul",
  "providerUserId": "12345",
  "connectedAt": "2025-12-11T12:00:00.000Z",
  "lastUpdated": "2025-12-11T12:00:00.000Z"
}
```

**Resposta se não conectado**:
```json
{
  "connected": false,
  "provider": "conta-azul"
}
```

---

## 🔧 Implementação no Frontend (Passo a Passo)

### **Passo 1: Botão de Login com Conta Azul**

```typescript
// components/OAuthLogin.tsx (ou similar)
import { useAuth } from '@/context/useAuth'; // Seu context com JWT

export function OAuthLoginButton() {
  const { jwtToken } = useAuth();
  
  const handleContaAzulLogin = () => {
    // Redirecionar para o endpoint de autorização
    window.location.href = 'http://localhost:3333/integrations/oauth/authorize?provider=conta-azul';
  };

  return (
    <button onClick={handleContaAzulLogin} className="btn-primary">
      🔗 Conectar Conta Azul
    </button>
  );
}
```

---

### **Passo 2: Página de Callback (Pós-Redirecionamento)**

```typescript
// pages/oauth-callback.tsx
import { useEffect, useRouter } from 'next/router';
import { useAuth } from '@/context/useAuth';

export default function OAuthCallback() {
  const router = useRouter();
  const { jwtToken } = useAuth();
  
  useEffect(() => {
    const processCallback = async () => {
      // A API já processou o callback automaticamente
      // Aqui você pode redirecionar o usuário para onde quiser
      
      // Aguardar um pouco para garantir que o BD foi atualizado
      setTimeout(() => {
        router.push('/dashboard'); // Ou qualquer página desejada
      }, 1500);
    };

    if (router.isReady) {
      processCallback();
    }
  }, [router, jwtToken]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-gray-600">Processando integração com Conta Azul...</p>
    </div>
  );
}
```

---

### **Passo 3: Verificar Status de Integração**

```typescript
// hooks/useContaAzulIntegration.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';

export function useContaAzulIntegration() {
  const { jwtToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          'http://localhost:3333/integrations/oauth/status?provider=conta-azul',
          {
            headers: {
              'Authorization': `Bearer ${jwtToken}`
            }
          }
        );

        if (!response.ok) throw new Error('Erro ao verificar status');
        
        const data = await response.json();
        setIsConnected(data.connected);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (jwtToken) {
      checkStatus();
    }
  }, [jwtToken]);

  return { isConnected, loading, error };
}
```

---

### **Passo 4: Componente Completo**

```typescript
// components/ContaAzulIntegration.tsx
import { useContaAzulIntegration } from '@/hooks/useContaAzulIntegration';
import { useAuth } from '@/context/useAuth';

export function ContaAzulIntegration() {
  const { jwtToken } = useAuth();
  const { isConnected, loading } = useContaAzulIntegration();

  const handleConnect = () => {
    window.location.href = 'http://localhost:3333/integrations/oauth/authorize?provider=conta-azul';
  };

  const handleDisconnect = async () => {
    // Você pode implementar um endpoint para desconectar depois
    alert('Desconexão ainda não implementada no backend');
  };

  if (loading) {
    return <div>Carregando status...</div>;
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <h3 className="text-lg font-semibold mb-4">Integração Conta Azul</h3>
      
      {isConnected ? (
        <div className="text-green-600">
          <p className="font-semibold">✅ Conectado com sucesso!</p>
          <button 
            onClick={handleDisconnect}
            className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Desconectar
          </button>
        </div>
      ) : (
        <button 
          onClick={handleConnect}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
        >
          🔗 Conectar Conta Azul
        </button>
      )}
    </div>
  );
}
```

---

## 📊 Fluxo Completo Ilustrado

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ Clica em "Conectar Conta Azul"
       ↓
┌───────────────────────────────────────────────────┐
│ window.location.href =                            │
│ http://localhost:3333/integrations/oauth/         │
│ authorize?provider=conta-azul                     │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │ API Gera State        │
         │ Redireciona para:     │
         │ conta-azul.com/...    │
         └───────────┬───────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  Tela Login Conta Azul│
         │  Usuário Autoriza     │
         └───────────┬───────────┘
                     │
       Redireciona com CODE
                     │
                     ↓
┌────────────────────────────────────────────────┐
│ http://localhost:3333/integrations/oauth/      │
│ callback?provider=conta-azul&code=XXX&state=YY│
│                                                │
│ API verifica JWT (usuario autenticado?)       │
│ ✅ SIM → Troca código por token              │
│         Salva no banco (Integration table)   │
│         Return JSON com sucesso              │
│                                                │
│ ❌ NÃO → Erro 401 Unauthorized               │
└────────────────────┬──────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │ Frontend Redireciona  │
         │ para /dashboard       │
         │ (página de sucesso)   │
         └───────────────────────┘

✅ Token salvo no BD da API
```

---

## 🔐 Segurança: Por que precisa de JWT?

```typescript
// ❌ ERRADO - Sem autenticação
fetch('http://localhost:3333/integrations/oauth/callback?provider=conta-azul&code=XXXXX')
// Qualquer pessoa consegue roubar o token!

// ✅ CORRETO - Com JWT do usuário
fetch('http://localhost:3333/integrations/oauth/callback?provider=conta-azul&code=XXXXX', {
  headers: {
    'Authorization': `Bearer ${meuJWT}`  // Prova que sou o usuário
  }
})
// Apenas você consegue integrar com sua conta
```

O JWT garante que:
1. **Você é quem diz ser** (autenticação)
2. **O token é vinculado ao SEU usuário** no banco de dados
3. **Ninguém pode roubar e usar o token de outro usuário**

---

## 🧪 Teste Prático (sem Frontend)

### Simulação completa com cURL:

```bash
# 1. Primeiro, obtenha seu JWT
JWT_TOKEN="seu_token_jwt_aqui"

# 2. Acesse o authorize (seu navegador)
open "http://localhost:3333/integrations/oauth/authorize?provider=conta-azul"

# 3. Faça login no Conta Azul e autorize
# Você será redirecionado para o callback automaticamente

# 4. Verifique se conectou com sucesso
curl -X GET "http://localhost:3333/integrations/oauth/status?provider=conta-azul" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

---

## 📦 O que fica salvo no banco?

Quando a integração é bem-sucedida, a tabela `Integration` recebe:

```typescript
{
  id: "clc123...",              // ID único
  userId: "user-123",            // Seu ID no sistema
  provider: "conta-azul",        // Provedor
  providerUserId: "12345",       // ID no Conta Azul
  accessToken: "eyJhbGc...",    // Token para usar a API
  refreshToken: "eyJhbGc...",   // Token para renovar
  accessTokenExpiresAt: 2025-12-11T13:15:00Z,  // Quando expira
  isActive: true,                // Se está ativo
  metadata: null,                // Campo livre para dados extras
  createdAt: 2025-12-11T12:00:00Z,
  updatedAt: 2025-12-11T12:00:00Z
}
```

---

## 🚀 Próximos Passos

1. ✅ Integração OAuth funcionando
2. 📝 Usar tokens para fazer chamadas na API Conta Azul
3. 🔄 Implementar refresh automático de tokens
4. 🛡️ Criptografar tokens no banco
5. 🧹 Endpoint para desconectar/revogar acesso

---

## 💡 Resumo para o Frontend

| Ação | Endpoint | Método | Auth | Redirect |
|------|----------|--------|------|----------|
| **Iniciar integração** | `/integrations/oauth/authorize?provider=conta-azul` | GET | Não | Sim (Conta Azul) |
| **Processar callback** | `/integrations/oauth/callback?provider=conta-azul&code=X` | GET | **Sim (JWT)** | Automático |
| **Checar status** | `/integrations/oauth/status?provider=conta-azul` | GET | **Sim (JWT)** | Não |

---

**Você está pronto para integrar no frontend!** 🎉
