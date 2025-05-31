# Deploying Supabase Changes to Production

## Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Access to your production Supabase project
- Production project ID and database URL

## Step 1: Link to Production Project

If not already linked, link your local project to the production Supabase instance:

```bash
# Login to Supabase (if not already logged in)
bun run supabase:login

# Link to your production project
supabase link --project-ref YOUR_PROJECT_ID
```

You can find your project ID in the Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_ID`

## Step 2: Push Database Migrations

Push all pending migrations to production:

```bash
# Push all migrations to production
bun run supabase:db:push

# Or manually run:
supabase db push
```

This will apply the following new migrations:
- `20250531010000_add_webhook_fields_to_video_jobs.sql` - Adds webhook fields to video_jobs table
- `20250531010100_add_refund_tokens_function.sql` - Adds token refund functionality
- `20250531020000_add_video_jobs_rls_policies.sql` - Adds RLS policies for video_jobs

## Step 3: Verify Migrations

Check that migrations were applied successfully:

```bash
# List remote migrations
supabase migration list

# Or check in Supabase dashboard:
# SQL Editor > Run: SELECT * FROM supabase_migrations.schema_migrations;
```

## Step 4: Update Environment Variables

Ensure your production environment (Vercel) has all required environment variables:

### Required Supabase Variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (⚠️ Keep this secret!)

### Set in Vercel Dashboard:
1. Go to your project in Vercel
2. Settings > Environment Variables
3. Add/update the variables for Production environment

## Step 5: Deploy Application

After migrations are applied and environment variables are set:

```bash
# Commit and push your code changes
git add .
git commit -m "Add video webhook support and RLS policies"
git push origin master
```

Vercel will automatically deploy the changes.

## Step 6: Verify Production

After deployment:

1. **Check Database Structure:**
   - Go to Supabase Dashboard > Table Editor
   - Verify `video_jobs` table has new columns:
     - `gateway_request_id`
     - `result_payload`
     - `error_payload`
     - `image_urls`
     - `tokens_refunded`

2. **Test Webhook Endpoint:**
   - Your webhook URL will be: `https://your-domain.com/api/webhooks/fal-ai`
   - Check Vercel function logs for any errors

3. **Test Video Generation:**
   - Try generating a video in production
   - Monitor Supabase logs and Vercel function logs

## Troubleshooting

### If migrations fail:

1. **Check migration syntax:**
   ```bash
   # Validate migrations locally
   supabase db reset
   ```

2. **Manual migration (if needed):**
   - Go to Supabase Dashboard > SQL Editor
   - Copy and run each migration SQL file manually

3. **RLS Policy Issues:**
   - If users can't access their video jobs, check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'video_jobs';
   ```

### If webhooks aren't working:

1. **Check webhook URL in fal.ai calls:**
   - Ensure `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
   - Or hardcode to your production URL

2. **Check Vercel function logs:**
   - Vercel Dashboard > Functions > View logs for `/api/webhooks/fal-ai`

3. **Test webhook manually:**
   ```bash
   curl -X POST https://your-domain.com/api/webhooks/fal-ai \
     -H "Content-Type: application/json" \
     -d '{"request_id": "test", "status": "OK", "payload": {"video": {"url": "test"}}}'
   ```

## Rollback (if needed)

If something goes wrong:

```bash
# Rollback the last migration
supabase migration down

# Or manually in SQL Editor:
DROP POLICY IF EXISTS "Users can view their own video jobs" ON public.video_jobs;
DROP POLICY IF EXISTS "Users can insert their own video jobs" ON public.video_jobs;
DROP POLICY IF EXISTS "Service role can do everything" ON public.video_jobs;
-- etc.
```