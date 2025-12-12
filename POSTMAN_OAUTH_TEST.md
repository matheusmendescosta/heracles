# 🧪 Teste OAuth no Postman

## ✅ Sim! Você consegue testar tudo no Postman

---

## 📋 Pré-requisitos

1. **Ter um usuário criado na API**
   ```bash
   # Crie uma conta primeiro
   POST http://localhost:3333/auth/signup
   Body:
   {
     "email": "teste@example.com",
     "password": "senha123"
   }
   ```

2. **Fazer login para obter JWT**
   ```bash
   POST http://localhost:3333/auth/signin
   Body:
   {
     "email": "teste@example.com",
     "password": "senha123"
   }
   
   # Resposta:
   {
     "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

3. **Copiar o JWT para usar nos testes**

---

## 🧪 Teste 1: Verificar Status (Antes de Conectar)

**Requisição:**
```
GET http://localhost:3333/integrations/oauth/status?provider=conta-azul
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta Esperada (200 OK):**
```json
{
  "connected": false,
  "provider": "conta-azul"
}
```

---

## 🔗 Teste 2: Obter URL de Autorização

**Requisição:**
```
GET http://localhost:3333/integrations/oauth/authorize?provider=conta-azul
```

**Headers:** (Não precisa de autenticação neste passo)
```
Deixe vazio
```

**O que vai acontecer:**
- ✅ Postman vai retornar **200 OK** com a URL completa
- 📋 Na resposta, copie o valor de `authorizationUrl`

**Resposta Esperada:**
```json
{
  "authorizationUrl": "https://auth.contaazul.com/login?response_type=code&client_id=rsv1u7jeudn88nudu7fjicpqi&redirect_uri=http://localhost:3333/integrations/oauth/callback&state=uuid-aleatorio-aqui&scope=openid+profile+aws.cognito.signin.user.admin",
  "message": "Copy the URL below and paste in your browser"
}
```

---

## 🎯 Teste 3: Fazer Login e Obter o Código

1. **Abra a URL que você copiou** no navegador:
   ```
   https://auth.contaazul.com/login?response_type=code&...
   ```

2. **Faça login** com suas credenciais Conta Azul

3. **Clique em autorizar**

4. **Capture o redirect** - você será redirecionado para:
   ```
   http://localhost:3333/integrations/oauth/callback?provider=conta-azul&code=CODIGO_AQUI&state=uuid-aleatorio
   ```

5. **Copie o `code`** (a parte depois de `code=` e antes de `&state`)

---

## ✨ Teste 4: Processar o Callback (O IMPORTANTE!)

**Requisição:**
```
GET http://localhost:3333/integrations/oauth/callback?provider=conta-azul&code=SEU_CODIGO_AQUI&state=uuid-aleatorio
```

**Headers (OBRIGATÓRIO):**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Importante**: Use o JWT que você obteve no pré-requisito!

**Resposta Esperada (200 OK):**
```json
{
  "success": true,
  "message": "Integration with conta-azul completed successfully",
  "integrationId": "clc123xyz789...",
  "providerUserId": "12345"
}
```

Se receber **401 Unauthorized**, significa:
- ❌ JWT expirou
- ❌ JWT está incorreto
- ❌ Usuário não existe

**Obtenha um novo JWT e tente novamente!**

---

## ✅ Teste 5: Verificar Status (Após Conectar)

**Requisição:**
```
GET http://localhost:3333/integrations/oauth/status?provider=conta-azul
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta Esperada (200 OK):**
```json
{
  "connected": true,
  "provider": "conta-azul",
  "providerUserId": "12345",
  "connectedAt": "2025-12-11T12:30:00.000Z",
  "lastUpdated": "2025-12-11T12:30:00.000Z"
}
```

✅ **Pronto! Integração funcionando!**

---

## 📦 Coleção do Postman (Pronta para Importar)

Copie e cole no Postman (`File > Import > Paste Raw Text`):

```json
{
  "info": {
    "name": "OAuth Conta Azul",
    "description": "Testes de integração OAuth",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Signup (Criar Conta)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"teste@example.com\",\n  \"password\": \"senha123\"\n}"
        },
        "url": {
          "raw": "http://localhost:3333/auth/signup",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3333",
          "path": ["auth", "signup"]
        }
      }
    },
    {
      "name": "2. Signin (Obter JWT)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"teste@example.com\",\n  \"password\": \"senha123\"\n}"
        },
        "url": {
          "raw": "http://localhost:3333/auth/signin",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3333",
          "path": ["auth", "signin"]
        }
      }
    },
    {
      "name": "3. Status Antes de Conectar",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3333/integrations/oauth/status?provider=conta-azul",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3333",
          "path": ["integrations", "oauth", "status"],
          "query": [
            {
              "key": "provider",
              "value": "conta-azul"
            }
          ]
        }
      }
    },
    {
      "name": "4. Obter URL de Autorização",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3333/integrations/oauth/authorize?provider=conta-azul",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3333",
          "path": ["integrations", "oauth", "authorize"],
          "query": [
            {
              "key": "provider",
              "value": "conta-azul"
            }
          ]
        }
      }
    },
    {
      "name": "5. Processar Callback (COM CÓDIGO)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3333/integrations/oauth/callback?provider=conta-azul&code=SEU_CODIGO_AQUI&state=estado-aleatorio",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3333",
          "path": ["integrations", "oauth", "callback"],
          "query": [
            {
              "key": "provider",
              "value": "conta-azul"
            },
            {
              "key": "code",
              "value": "SEU_CODIGO_AQUI"
            },
            {
              "key": "state",
              "value": "estado-aleatorio"
            }
          ]
        }
      }
    },
    {
      "name": "6. Status Após Conectar",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3333/integrations/oauth/status?provider=conta-azul",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3333",
          "path": ["integrations", "oauth", "status"],
          "query": [
            {
              "key": "provider",
              "value": "conta-azul"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 📝 Passo a Passo Completo no Postman

### **Passo 1: Criar Conta**
1. Clique em "1. Signup (Criar Conta)"
2. Clique em "Send"
3. Resposta: `201 Created`

### **Passo 2: Fazer Login**
1. Clique em "2. Signin (Obter JWT)"
2. Clique em "Send"
3. Copie o `accessToken` da resposta

### **Passo 3: Salvar JWT como Variável**
1. Clique em "Environment" (engrenagem no canto superior direito)
2. Clique em "Edit" (próximo ao seletor de ambientes)
3. Adicione uma variável:
   ```
   Nome: jwt_token
   Valor: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Clique em "Save"

### **Passo 4: Verificar Status (Antes)**
1. Clique em "3. Status Antes de Conectar"
2. Clique em "Send"
3. Resposta deve ser `"connected": false`

### **Passo 5: Obter URL de Autorização**
1. Clique em "4. Obter URL de Autorização"
2. Clique em "Send"
3. Na resposta (JSON), copie o valor de `authorizationUrl`

### **Passo 6: Fazer Login no Conta Azul**
1. Abra a URL copiada no navegador
2. Faça login com suas credenciais
3. Autorize o acesso
4. Você será redirecionado para um URL como:
   ```
   http://localhost:3333/integrations/oauth/callback?provider=conta-azul&code=XXXXXXX&state=YYYYYYY
   ```
5. **Copie o valor de `code`**

### **Passo 7: Processar Callback**
1. Clique em "5. Processar Callback (COM CÓDIGO)"
2. Substitua `SEU_CODIGO_AQUI` pelo código que você copiou
3. Clique em "Send"
4. Resposta esperada: `"success": true`

### **Passo 8: Verificar Status (Depois)**
1. Clique em "6. Status Após Conectar"
2. Clique em "Send"
3. Resposta deve ser `"connected": true`

✅ **Integração bem-sucedida!**

---

## 🐛 Troubleshooting no Postman

| Erro | Causa | Solução |
|------|-------|---------|
| **401 Unauthorized** | JWT expirado ou inválido | Obtenha um novo JWT no passo 2 |
| **400 Bad Request** | Código expirou | Refaça o login no Conta Azul (passo 6) |
| **302 Found** | Redirecionamento normal | A resposta vem em JSON agora, copie `authorizationUrl` |
| **500 Internal Server Error** | Erro na API | Verifique os logs do Docker |

---

## 💡 Dica de Ouro

Se o código expirou entre o passo 6 e 7, você precisa:
1. Voltar ao passo 6 (Obter URL de Autorização)
2. Fazer login novamente no Conta Azul
3. Copiar o novo código
4. Ir direto para o passo 7 (Processar Callback)

**O código tem validade curta (geralmente 5-10 minutos)**, então faça isso rápido! ⚡

---

**Tudo pronto para testar no Postman!** 🚀
