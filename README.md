<<<<<<< HEAD
# GPT Access API - Eduzz Webhook ✅

## Troubleshooting Deploy Crash (FUNCTION_INVOCATION_FAILED)
1. **Vercel Env Vars**: Add SUPABASE_SERVICE_ROLE_KEY, EDUZZ_SECRET in dashboard.
2. **Supabase**:
   - `access` table columns: `ativo boolean`, `expires_at timestamptz`.
   - RLS policy: Allow `service_role`.
3. **Logs**: Vercel dashboard → Functions → eduzz-webhook → View Logs.

## Local Test (vercel dev)
1. `.env`: Set vars (see .env.example).
2. `npx vercel dev`
3. `node test-webhook.js` (auto signature).

## Production Test Curl (PowerShell, replace APP_URL & SECRET)
```powershell
$secret = 'your_secret'
$payload = '{\"transaction\":{\"id\":\"test123\",\"status\":\"approved\",\"created_at\":\"2024-09-10T12:00:00Z\",\"buyer\":{\"email\":\"test@example.com\"}}}'
$sig = 'sha256=' + [Convert]::ToBase64String([System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($secret)).ComputeHash([Text.Encoding]::UTF8.GetBytes($payload)))
curl.exe -X POST https://gpt-access-api.vercel.app/api/eduzz-webhook -H \"Content-Type: application/json\" -H \"x-eduzz-signature: $sig\" -d $payload
```

## Setup Steps
1. Supabase columns/RLS.
2. Vercel env vars.
3. Redeploy `vercel --prod`.
4. Eduzz webhook → URL + secret.

## Payload Example
```json
{\"transaction\":{\"id\":\"txn123\",\"status\":\"approved\",\"created_at\":\"2024-09-10T12:00:00Z\",\"buyer\":{\"email\":\"user@test.com\"}}}
```

Old webhook.js backup. test-webhook.js ready.

**Restart vercel dev & test locally first!**

=======
# 🚀 Monetização de IA com Acesso Automatizado

## 📌 Sobre o projeto
Este projeto foi desenvolvido para resolver um problema real: a dificuldade de escalar a venda de acesso a um GPT personalizado devido a processos manuais.

Antes, todo o fluxo dependia de intervenção humana — liberação de acesso, controle de usuários e bloqueios — o que limitava completamente o crescimento do produto.

A solução foi a criação de um sistema automatizado de ponta a ponta, transformando a IA em um produto digital escalável.

---

## ⚙️ Funcionalidades

- Integração com plataforma de pagamentos  
- Liberação automática de acesso via webhook  
- Controle de acesso com expiração  
- Bloqueio automático em caso de cancelamento  
- Autenticação de usuários  
- Integração direta com GPT (Actions)  

---

## 🔄 Fluxo de funcionamento

```text
Pagamento aprovado → acesso liberado automaticamente  
Cancelamento → acesso revogado automaticamente
>>>>>>> 8013dcc422d0ada668e4146a0651440f1cf8d2e6
