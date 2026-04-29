# TODO: Implement Eduzz Webhook Integration

## Steps from Approved Plan

### 1. ✅ Update lib/supabase.js
- Add supabaseAdmin client with SERVICE_ROLE_KEY

### 2. ✅ Create api/eduzz-webhook.js
- Implement signature validation
- Parse Eduzz payload
- Upsert to access table (ativo=true, expires_at=+30d)

### 3. ✅ Backup old api/webhook.js (kept as-is)

### 4. ✅ Add .env.example & README.md with instructions/tests

### 5. ✅ COMPLETE
All files updated. Follow README.md for Supabase setup/deploy/test.

**Integration ready!**
