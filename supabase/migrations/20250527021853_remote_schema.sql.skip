alter table "public"."subscriptions" drop column "tokens";

alter table "public"."subscriptions" add column "permanent_tokens" numeric default 0;

alter table "public"."subscriptions" add column "renewable_tokens" numeric default 125;

alter table "public"."users" add column "stripe_customer_id" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_permanent_tokens(in_user_id uuid, in_tokens_to_add integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE subscriptions
  SET permanent_tokens = COALESCE(permanent_tokens, 0) + in_tokens_to_add
  WHERE user_id = in_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_all_user_tokens()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE subscriptions
  SET renewable_tokens = 125,
      renewed_at = NOW()
  WHERE plan = 'free'
    AND (renewed_at IS NULL OR renewed_at < NOW() - INTERVAL '28 days');

  UPDATE subscriptions
  SET renewable_tokens = 4000,
      renewed_at = NOW()
  WHERE plan = 'standard'
    AND (renewed_at IS NULL OR renewed_at < NOW() - INTERVAL '28 days');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_free_user_tokens()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE subscriptions
  SET renewable_tokens = 125,
      renewed_at = NOW()
  WHERE plan = 'free'
    AND (renewed_at IS NULL OR renewed_at < NOW() - INTERVAL '28 days');
END;
$function$
;

create policy "Users can update their own subscriptions"
on "public"."subscriptions"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = subscriptions.user_id) AND (users.clerk_id = requesting_user_id())))))
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = subscriptions.user_id) AND (users.clerk_id = requesting_user_id())))));



