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

