alter table "public"."subscriptions" drop column "pro_tokens_cap";

alter table "public"."subscriptions" drop column "pro_tokens_used";

alter table "public"."subscriptions" add column "premium_generations_used" integer default 0;

alter table "public"."subscriptions" add constraint "premium_generations_cap" CHECK ((premium_generations_used <= 100)) not valid;

alter table "public"."subscriptions" validate constraint "premium_generations_cap";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.reset_premium_generations_on_renewal()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.renewed_at IS DISTINCT FROM OLD.renewed_at THEN
    NEW.premium_generations_used := 0;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER trigger_reset_premium_generations BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION reset_premium_generations_on_renewal();


