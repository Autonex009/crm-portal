


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "activities_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['company'::"text", 'contact'::"text", 'lead'::"text", 'deal'::"text", 'quote'::"text", 'invoice'::"text"]))),
    CONSTRAINT "activities_type_check" CHECK (("type" = ANY (ARRAY['note'::"text", 'call'::"text", 'email'::"text", 'meeting'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "before" "jsonb",
    "after" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid",
    "google_event_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone NOT NULL,
    "meet_link" "text",
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "domain" "text",
    "industry" "text",
    "logo_path" "text",
    "owner_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "title" "text",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "primary_contact_id" "uuid",
    "stage" "text" DEFAULT 'prospect'::"text" NOT NULL,
    "amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "expected_close_date" "date",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" DEFAULT 'New Deal'::"text" NOT NULL,
    "job_title" "text",
    "product_use_case" "text",
    "probability" integer,
    "next_action" "text",
    "notes" "text",
    CONSTRAINT "deals_probability_check" CHECK ((("probability" IS NULL) OR (("probability" >= 0) AND ("probability" <= 100)))),
    CONSTRAINT "deals_stage_check" CHECK (("stage" = ANY (ARRAY['prospect'::"text", 'proposal'::"text", 'negotiation'::"text", 'won'::"text", 'lost'::"text"])))
);


ALTER TABLE "public"."deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follow_ups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "scheduled_for" timestamp with time zone NOT NULL,
    "channel" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempt_number" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "follow_ups_channel_check" CHECK (("channel" = ANY (ARRAY['email'::"text", 'slack'::"text"]))),
    CONSTRAINT "follow_ups_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."follow_ups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "scope" "text",
    "provider_account_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "integration_connections_provider_check" CHECK (("provider" = ANY (ARRAY['google'::"text", 'slack'::"text"])))
);


ALTER TABLE "public"."integration_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "amount_due" numeric(15,2) DEFAULT 0 NOT NULL,
    "currency" character(3) DEFAULT 'USD'::"bpchar" NOT NULL,
    "due_date" "date",
    "stripe_invoice_id" "text",
    "payment_link" "text",
    "account_manager_id" "uuid",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'overdue'::"text", 'void'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "contact_id" "uuid",
    "source" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "assigned_to" "uuid",
    "value_estimate" numeric(15,2),
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "contact_name" "text",
    "job_title" "text",
    "email" "text",
    "phone" "text",
    "linkedin_url" "text",
    "industry" "text",
    "location" "text",
    "product_interest" "text",
    "next_follow_up_date" "date",
    "notes" "text",
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'qualified'::"text", 'lost'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "currency" character(3) DEFAULT 'USD'::"bpchar" NOT NULL,
    "stripe_payment_intent_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'succeeded'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "unit_price" numeric(15,4) DEFAULT 0 NOT NULL,
    "currency" character(3) DEFAULT 'USD'::"bpchar" NOT NULL,
    "tax_rate" numeric(5,2) DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" DEFAULT 'sales'::"text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text", 'client'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quote_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_version_id" "uuid" NOT NULL,
    "magic_link_token" "text" NOT NULL,
    "approved_by_name" "text",
    "approved_by_email" "text",
    "signature_data" "text",
    "approved_at" timestamp with time zone,
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quote_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quote_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "line_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "tax" numeric(15,2) DEFAULT 0 NOT NULL,
    "total" numeric(15,2) DEFAULT 0 NOT NULL,
    "currency" character(3) DEFAULT 'USD'::"bpchar" NOT NULL,
    "pdf_path" "text",
    "is_current" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quote_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "current_version" integer DEFAULT 1 NOT NULL,
    "created_by" "uuid" NOT NULL,
    "valid_until" "date",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "quotes_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'approved'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slack_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "slack_channel_id" "text" NOT NULL,
    "channel_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."slack_channels" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_google_event_id_key" UNIQUE ("google_event_id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follow_ups"
    ADD CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quote_approvals"
    ADD CONSTRAINT "quote_approvals_magic_link_token_key" UNIQUE ("magic_link_token");



ALTER TABLE ONLY "public"."quote_approvals"
    ADD CONSTRAINT "quote_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quote_versions"
    ADD CONSTRAINT "quote_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quote_versions"
    ADD CONSTRAINT "quote_versions_quote_id_version_number_key" UNIQUE ("quote_id", "version_number");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slack_channels"
    ADD CONSTRAINT "slack_channels_deal_id_key" UNIQUE ("deal_id");



ALTER TABLE ONLY "public"."slack_channels"
    ADD CONSTRAINT "slack_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slack_channels"
    ADD CONSTRAINT "slack_channels_slack_channel_id_key" UNIQUE ("slack_channel_id");



CREATE INDEX "idx_activities_entity" ON "public"."activities" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_log_actor" ON "public"."audit_log" USING "btree" ("actor_id");



CREATE INDEX "idx_audit_log_entity" ON "public"."audit_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_follow_ups_scheduled" ON "public"."follow_ups" USING "btree" ("status", "scheduled_for") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_quote_approvals_token" ON "public"."quote_approvals" USING "btree" ("magic_link_token");



CREATE OR REPLACE TRIGGER "trg_activities_updated_at" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_calendar_events_updated_at" BEFORE UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_deals_updated_at" BEFORE UPDATE ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_follow_ups_updated_at" BEFORE UPDATE ON "public"."follow_ups" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_integration_connections_updated_at" BEFORE UPDATE ON "public"."integration_connections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_invoices_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_quote_approvals_updated_at" BEFORE UPDATE ON "public"."quote_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_quote_versions_updated_at" BEFORE UPDATE ON "public"."quote_versions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_quotes_updated_at" BEFORE UPDATE ON "public"."quotes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_slack_channels_updated_at" BEFORE UPDATE ON "public"."slack_channels" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_primary_contact_id_fkey" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."contacts"("id");



ALTER TABLE ONLY "public"."follow_ups"
    ADD CONSTRAINT "follow_ups_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."integration_connections"
    ADD CONSTRAINT "integration_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_account_manager_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quote_approvals"
    ADD CONSTRAINT "quote_approvals_quote_version_id_fkey" FOREIGN KEY ("quote_version_id") REFERENCES "public"."quote_versions"("id");



ALTER TABLE ONLY "public"."quote_versions"
    ADD CONSTRAINT "quote_versions_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id");



ALTER TABLE ONLY "public"."slack_channels"
    ADD CONSTRAINT "slack_channels_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id");



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities: admin delete" ON "public"."activities" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "activities: author or admin update" ON "public"."activities" FOR UPDATE USING ((("public"."current_user_role"() = 'admin'::"text") OR ("author_id" = "auth"."uid"())));



CREATE POLICY "activities: internal users insert" ON "public"."activities" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "activities: internal users read" ON "public"."activities" FOR SELECT USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log: admins read all" ON "public"."audit_log" FOR SELECT USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "audit_log: internal users insert" ON "public"."audit_log" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "calendar_events: admin delete" ON "public"."calendar_events" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "calendar_events: internal users insert" ON "public"."calendar_events" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "calendar_events: internal users read" ON "public"."calendar_events" FOR SELECT USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "calendar_events: internal users update" ON "public"."calendar_events" FOR UPDATE USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies: admin delete" ON "public"."companies" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "companies: admins read deleted" ON "public"."companies" FOR SELECT USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "companies: internal users insert" ON "public"."companies" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "companies: internal users read" ON "public"."companies" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"]))));



CREATE POLICY "companies: owner or admin update" ON "public"."companies" FOR UPDATE USING ((("public"."current_user_role"() = 'admin'::"text") OR ("owner_id" = "auth"."uid"())));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts: admin delete" ON "public"."contacts" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "contacts: internal users insert" ON "public"."contacts" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "contacts: internal users read" ON "public"."contacts" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"]))));



CREATE POLICY "contacts: internal users update" ON "public"."contacts" FOR UPDATE USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deals: account_manager read all" ON "public"."deals" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = 'account_manager'::"text")));



CREATE POLICY "deals: admin delete" ON "public"."deals" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "deals: admin read all" ON "public"."deals" FOR SELECT USING ((("public"."current_user_role"() = 'admin'::"text") AND ("deleted_at" IS NULL)));



CREATE POLICY "deals: internal users insert" ON "public"."deals" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "deals: owner or admin update" ON "public"."deals" FOR UPDATE USING ((("public"."current_user_role"() = 'admin'::"text") OR (("public"."current_user_role"() = ANY (ARRAY['sales'::"text", 'account_manager'::"text"])) AND ("owner_id" = "auth"."uid"()))));



CREATE POLICY "deals: sales read own" ON "public"."deals" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = 'sales'::"text") AND ("owner_id" = "auth"."uid"())));



ALTER TABLE "public"."follow_ups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "follow_ups: internal users insert" ON "public"."follow_ups" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "follow_ups: internal users read" ON "public"."follow_ups" FOR SELECT USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "follow_ups: internal users update" ON "public"."follow_ups" FOR UPDATE USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



ALTER TABLE "public"."integration_connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integration_connections: owner delete" ON "public"."integration_connections" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR ("public"."current_user_role"() = 'admin'::"text")));



CREATE POLICY "integration_connections: owner insert" ON "public"."integration_connections" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "integration_connections: owner read" ON "public"."integration_connections" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("public"."current_user_role"() = 'admin'::"text")));



CREATE POLICY "integration_connections: owner update" ON "public"."integration_connections" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("public"."current_user_role"() = 'admin'::"text")));



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices: account_manager read assigned" ON "public"."invoices" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = 'account_manager'::"text") AND ("account_manager_id" = "auth"."uid"())));



CREATE POLICY "invoices: admin delete" ON "public"."invoices" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "invoices: admin read all" ON "public"."invoices" FOR SELECT USING ((("public"."current_user_role"() = 'admin'::"text") AND ("deleted_at" IS NULL)));



CREATE POLICY "invoices: internal users insert" ON "public"."invoices" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "invoices: internal users update" ON "public"."invoices" FOR UPDATE USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "invoices: sales read own company" ON "public"."invoices" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = 'sales'::"text")));



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads: account_manager read all active" ON "public"."leads" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = 'account_manager'::"text")));



CREATE POLICY "leads: admin delete" ON "public"."leads" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "leads: admin read all" ON "public"."leads" FOR SELECT USING ((("public"."current_user_role"() = 'admin'::"text") AND ("deleted_at" IS NULL)));



CREATE POLICY "leads: internal users insert" ON "public"."leads" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "leads: internal users update" ON "public"."leads" FOR UPDATE USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "leads: sales read own or assigned" ON "public"."leads" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = 'sales'::"text") AND ("assigned_to" = "auth"."uid"())));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments: internal users insert" ON "public"."payments" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "payments: internal users read" ON "public"."payments" FOR SELECT USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products: admin delete" ON "public"."products" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "products: admin insert" ON "public"."products" FOR INSERT WITH CHECK (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "products: admin update" ON "public"."products" FOR UPDATE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "products: internal users read active" ON "public"."products" FOR SELECT USING ((("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])) AND (("active" = true) OR ("public"."current_user_role"() = 'admin'::"text"))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles: admins delete" ON "public"."profiles" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "profiles: admins insert" ON "public"."profiles" FOR INSERT WITH CHECK ((("public"."current_user_role"() = 'admin'::"text") OR ("id" = "auth"."uid"())));



CREATE POLICY "profiles: users read own" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR ("public"."current_user_role"() = 'admin'::"text")));



CREATE POLICY "profiles: users update own" ON "public"."profiles" FOR UPDATE USING ((("id" = "auth"."uid"()) OR ("public"."current_user_role"() = 'admin'::"text")));



ALTER TABLE "public"."quote_approvals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quote_approvals: internal users insert" ON "public"."quote_approvals" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "quote_approvals: internal users read" ON "public"."quote_approvals" FOR SELECT USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "quote_approvals: internal users update" ON "public"."quote_approvals" FOR UPDATE USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



ALTER TABLE "public"."quote_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quote_versions: internal users insert" ON "public"."quote_versions" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "quote_versions: internal users read" ON "public"."quote_versions" FOR SELECT USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "quote_versions: internal users update" ON "public"."quote_versions" FOR UPDATE USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quotes: account_manager read all" ON "public"."quotes" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = 'account_manager'::"text")));



CREATE POLICY "quotes: admin delete" ON "public"."quotes" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "quotes: admin read all" ON "public"."quotes" FOR SELECT USING ((("public"."current_user_role"() = 'admin'::"text") AND ("deleted_at" IS NULL)));



CREATE POLICY "quotes: internal users insert" ON "public"."quotes" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "quotes: owner or admin update" ON "public"."quotes" FOR UPDATE USING ((("public"."current_user_role"() = 'admin'::"text") OR (("public"."current_user_role"() = ANY (ARRAY['sales'::"text", 'account_manager'::"text"])) AND ("created_by" = "auth"."uid"()))));



CREATE POLICY "quotes: sales read own" ON "public"."quotes" FOR SELECT USING ((("deleted_at" IS NULL) AND ("public"."current_user_role"() = 'sales'::"text") AND ("created_by" = "auth"."uid"())));



ALTER TABLE "public"."slack_channels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "slack_channels: admin delete" ON "public"."slack_channels" FOR DELETE USING (("public"."current_user_role"() = 'admin'::"text"));



CREATE POLICY "slack_channels: internal users insert" ON "public"."slack_channels" FOR INSERT WITH CHECK (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



CREATE POLICY "slack_channels: internal users read" ON "public"."slack_channels" FOR SELECT USING (("public"."current_user_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text", 'account_manager'::"text"])));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON TABLE "public"."follow_ups" TO "anon";
GRANT ALL ON TABLE "public"."follow_ups" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_ups" TO "service_role";



GRANT ALL ON TABLE "public"."integration_connections" TO "anon";
GRANT ALL ON TABLE "public"."integration_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_connections" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."quote_approvals" TO "anon";
GRANT ALL ON TABLE "public"."quote_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."quote_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."quote_versions" TO "anon";
GRANT ALL ON TABLE "public"."quote_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."quote_versions" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."slack_channels" TO "anon";
GRANT ALL ON TABLE "public"."slack_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."slack_channels" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







