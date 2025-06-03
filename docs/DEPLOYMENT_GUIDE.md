# 🚨 CRITICAL Security Fix Deployment Guide

## Overview
This guide helps you deploy critical security fixes to your production Supabase database. **These fixes address serious vulnerabilities that could lead to data breaches.**

## ⚠️ URGENT: Security Issues Fixed
- Anonymous users could manipulate subscription data
- Service role had unlimited database access  
- Missing audit trails for sensitive operations
- No rate limiting protection
- Weak token validation functions

## 🔧 Deployment Options

### Option A: Deploy via Supabase CLI (Recommended)

#### Prerequisites
- Production Supabase project created
- Supabase CLI installed
- Database access credentials

#### Steps:
1. **Install Supabase CLI** (if not already done):
   ```bash
   curl -o- https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash
   ```

2. **Link to your production project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Apply the security migration**:
   ```bash
   supabase db push
   ```

### Option B: Deploy via Supabase Dashboard

#### Steps:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy the content from `supabase/migrations/20250610000000_security_fixes.sql`
5. Paste and run the SQL
6. Verify no errors occurred

### Option C: Deploy via Database Connection

#### Steps:
1. Get your database connection string from Supabase Dashboard
2. Use psql or your preferred PostgreSQL client:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   ```
3. Execute the migration file:
   ```sql
   \i supabase/migrations/20250610000000_security_fixes.sql
   ```

## 🔍 Post-Deployment Verification

### 1. Verify RLS Policies
Check that anonymous users can't access restricted data:
```sql
-- This should return 0 rows for anon users
SELECT count(*) FROM subscriptions;
```

### 2. Test Audit Logging
```sql
-- Check if audit log table exists
SELECT count(*) FROM audit_log;
```

### 3. Verify Rate Limiting
```sql
-- Check rate limits table
SELECT count(*) FROM rate_limits;
```

## 🚨 Critical Post-Deployment Actions

### 1. Rotate Service Role Key
- Go to Supabase Dashboard → Settings → API
- Generate new service role key
- Update your environment variables
- Deploy updated environment to production

### 2. Monitor Audit Logs
```sql
-- Check recent sensitive operations
SELECT * FROM audit_log 
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### 3. Update Environment Variables
If using the new rate limiting, update your API code to use:
```typescript
// Check rate limits before expensive operations
const canProceed = await supabase.rpc('check_rate_limit', {
  p_user_id: userId,
  p_operation: 'video_generation',
  p_max_per_hour: 10
});
```

## 🛡️ Security Validation Tests

After deployment, test these scenarios:

### 1. Anonymous Access Test
```bash
# Should fail - anon users can't modify subscriptions
curl -X POST 'https://your-project.supabase.co/rest/v1/subscriptions' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test"}'
```

### 2. Token Deduction Test
```sql
-- Should properly validate inputs
SELECT deduct_tokens(
  'valid-user-id'::uuid, 
  -10, -- negative amount should fail
  0
);
```

## 🚨 Emergency Rollback

If issues occur, you can rollback specific changes:

### Rollback Anonymous Permissions (NOT RECOMMENDED)
```sql
-- ONLY if absolutely necessary
GRANT INSERT ON TABLE "public"."subscriptions" TO "anon";
-- But this restores the vulnerability!
```

### Disable Audit Triggers (Temporary)
```sql
-- If audit logging causes issues
DROP TRIGGER IF EXISTS audit_subscriptions_trigger ON subscriptions;
```

## 📞 Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Review database error messages  
3. Verify all environment variables are updated
4. Test with a minimal example first

## ✅ Deployment Checklist

- [ ] Security migration applied successfully
- [ ] Service role key rotated
- [ ] Environment variables updated
- [ ] Audit logging working
- [ ] Rate limiting functional
- [ ] Anonymous access properly restricted
- [ ] Production testing completed
- [ ] Monitoring alerts configured

**Remember: These security fixes are critical. Do not delay deployment if you have production users.** 