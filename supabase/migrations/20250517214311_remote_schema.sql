create table "public"."subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "plan" text,
    "tokens" numeric,
    "renewed_at" timestamp without time zone,
    "pro_tokens_used" integer default 0,
    "pro_tokens_cap" integer default 1700
);


alter table "public"."subscriptions" enable row level security;

create table "public"."usage" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "tokens_used" integer,
    "created_at" timestamp without time zone default now()
);


create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "clerk_id" text,
    "email" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX usage_pkey ON public.usage USING btree (id);

CREATE UNIQUE INDEX users_clerk_id_key ON public.users USING btree (clerk_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."usage" add constraint "usage_pkey" PRIMARY KEY using index "usage_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

alter table "public"."usage" add constraint "usage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."usage" validate constraint "usage_user_id_fkey";

alter table "public"."users" add constraint "users_clerk_id_key" UNIQUE using index "users_clerk_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.deduct_tokens(p_user_id uuid, p_required_tokens numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update subscriptions
  set tokens = tokens - p_required_tokens
  where user_id = p_user_id
    and tokens >= p_required_tokens;

  if not found then
    raise exception 'Insufficient tokens or user not found';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.requesting_user_id()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT NULLIF(CURRENT_SETTING('request.jwt.claims', TRUE)::JSON->>'sub', '')::TEXT;
$function$
;

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."usage" to "anon";

grant insert on table "public"."usage" to "anon";

grant references on table "public"."usage" to "anon";

grant select on table "public"."usage" to "anon";

grant trigger on table "public"."usage" to "anon";

grant truncate on table "public"."usage" to "anon";

grant update on table "public"."usage" to "anon";

grant delete on table "public"."usage" to "authenticated";

grant insert on table "public"."usage" to "authenticated";

grant references on table "public"."usage" to "authenticated";

grant select on table "public"."usage" to "authenticated";

grant trigger on table "public"."usage" to "authenticated";

grant truncate on table "public"."usage" to "authenticated";

grant update on table "public"."usage" to "authenticated";

grant delete on table "public"."usage" to "service_role";

grant insert on table "public"."usage" to "service_role";

grant references on table "public"."usage" to "service_role";

grant select on table "public"."usage" to "service_role";

grant trigger on table "public"."usage" to "service_role";

grant truncate on table "public"."usage" to "service_role";

grant update on table "public"."usage" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "Users can insert their own subscriptions"
on "public"."subscriptions"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = subscriptions.user_id) AND (users.clerk_id = requesting_user_id())))));


create policy "Users can view their own subscriptions"
on "public"."subscriptions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = subscriptions.user_id) AND (users.clerk_id = requesting_user_id())))));


create policy "Users can insert their own data"
on "public"."users"
as permissive
for insert
to authenticated
with check ((requesting_user_id() = clerk_id));


create policy "Users can view their own data"
on "public"."users"
as permissive
for select
to authenticated
using ((requesting_user_id() = clerk_id));



