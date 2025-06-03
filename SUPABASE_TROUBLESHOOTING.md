# Supabase Connection Troubleshooting Guide

## Current Issue
```
failed to connect to postgres: failed to connect to `host=aws-0-us-east-2.pooler.supabase.com user=postgres.itsmevbohjloafhszmoy database=postgres`: hostname resolving error
```

## Solutions (in order of likelihood)

### 1. WSL2 Networking Issue
Since you're on WSL2, DNS resolution might be problematic.

**Fix:**
```bash
chmod +x fix_wsl_network.sh
./fix_wsl_network.sh
```

### 2. Supabase Project Not Linked
Your local Supabase CLI might not be properly linked to your remote project.

**Check:**
```bash
chmod +x check_supabase.sh
./check_supabase.sh
```

**Fix:**
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Environment Variables Missing
Create a `.env.local` file with proper Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
```

### 4. Use Local Development Instead
If remote connection continues to fail, use local development:

```bash
# Start local Supabase
bun run supabase:start

# Push migrations to local DB
supabase db push --local

# Check status
supabase status
```

### 5. Network Connectivity Issues
**Test connectivity:**
```bash
# Test DNS resolution
nslookup aws-0-us-east-2.pooler.supabase.com

# Test port connectivity
telnet aws-0-us-east-2.pooler.supabase.com 5432
```

**WSL2 specific fixes:**
```bash
# Restart WSL2 (run in Windows PowerShell as admin)
wsl --shutdown
wsl

# Or restart networking in WSL2
sudo service networking restart
```

### 6. Firewall/Corporate Network
If you're on a corporate network:
- Check if port 5432 is blocked
- Try using a VPN
- Contact IT about database connection allowlists

## Alternative: Switch to Local Development

If remote connection issues persist, consider developing locally:

```bash
# 1. Start local Supabase instance
bun run supabase:start

# 2. Apply migrations locally
supabase db push --local

# 3. Update your app to use local URLs
# In .env.local:
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

## Verification Steps

After applying fixes:

1. **Test connection:**
   ```bash
   supabase db push
   ```

2. **Check status:**
   ```bash
   supabase status
   ```

3. **Test app connectivity:**
   ```bash
   bun run dev
   ```

## Get Help

If issues persist:
1. Check Supabase status: https://status.supabase.com/
2. Review Supabase docs: https://supabase.com/docs/guides/cli
3. Join Supabase Discord: https://discord.supabase.com/