CREATE TABLE IF NOT EXISTS "notification_dispatches" (
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"notification_type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"claim_token" text,
	"claimed_at" timestamp,
	"lease_expires_at" timestamp,
	"next_attempt_at" timestamp,
	"provider_message_id" text,
	"last_error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "academic_programmes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"allowed_delivery_modes" jsonb DEFAULT '["online"]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "academic_programmes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"student_id" text NOT NULL,
	"programme_enrolment_id" text NOT NULL,
	"attendance_status" text NOT NULL,
	"attendance_channel" text NOT NULL,
	"verified_by" text,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campuses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"contact_phone" text,
	"contact_email" text,
	"facilities" jsonb DEFAULT '["electricity_backup","student_wifi","air_conditioning"]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campuses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "class_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"cohort_id" text NOT NULL,
	"course_id" text,
	"title" text NOT NULL,
	"description" text,
	"activity_type" text NOT NULL,
	"delivery_channel" text NOT NULL,
	"campus_id" text,
	"classroom_id" text,
	"instructor_id" text,
	"session_date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"meeting_url" text,
	"max_capacity" integer DEFAULT 30 NOT NULL,
	"booked_seats_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "classrooms" (
	"id" text PRIMARY KEY NOT NULL,
	"campus_id" text NOT NULL,
	"name" text NOT NULL,
	"room_number" text,
	"safe_capacity" integer DEFAULT 30 NOT NULL,
	"power_outlets_count" integer DEFAULT 30 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cohort_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"cohort_id" text NOT NULL,
	"programme_enrolment_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cohorts" (
	"id" text PRIMARY KEY NOT NULL,
	"programme_id" text NOT NULL,
	"pathway_id" text,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"delivery_arrangement" text NOT NULL,
	"campus_id" text,
	"default_classroom_id" text,
	"max_capacity" integer DEFAULT 30 NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'enrolling' NOT NULL,
	"fixed_timetable_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cohorts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "policy_acknowledgements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"programme_enrolment_id" text,
	"policy_type" text NOT NULL,
	"policy_version" text DEFAULT 'v1.0' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"acknowledged_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programme_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"programme_id" text NOT NULL,
	"pathway_id" text,
	"course_id" text NOT NULL,
	"course_role" text DEFAULT 'core' NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programme_enrolments" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"programme_id" text NOT NULL,
	"pathway_id" text,
	"delivery_arrangement" text NOT NULL,
	"cohort_id" text,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"byol_acknowledged" boolean DEFAULT false NOT NULL,
	"byol_acknowledged_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"enrolled_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programme_pathways" (
	"id" text PRIMARY KEY NOT NULL,
	"programme_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"target_outcomes" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "programme_pathways_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"programme_enrolment_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"booked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "programme_enrolment_id" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "code" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "is_foundation_course" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "programme_enrolment_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "programme_enrolment_id" text;--> statement-breakpoint
ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "student_category" text DEFAULT 'adult';--> statement-breakpoint
ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "date_of_birth" timestamp;--> statement-breakpoint
ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "school_name" text;--> statement-breakpoint
ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "guardian_name" text;--> statement-breakpoint
ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "guardian_email" text;--> statement-breakpoint
ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "guardian_phone" text;--> statement-breakpoint
ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "byol_acknowledged" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "registration_draft" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "student_category" text DEFAULT 'adult';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "school_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "guardian_consent_status" text DEFAULT 'not_applicable';--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_programme_enrolment_id_programme_enrolments_id_fk" FOREIGN KEY ("programme_enrolment_id") REFERENCES "public"."programme_enrolments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_programme_enrolment_id_programme_enrolments_id_fk" FOREIGN KEY ("programme_enrolment_id") REFERENCES "public"."programme_enrolments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_programme_id_academic_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."academic_programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_pathway_id_programme_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."programme_pathways"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_default_classroom_id_classrooms_id_fk" FOREIGN KEY ("default_classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_acknowledgements" ADD CONSTRAINT "policy_acknowledgements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_acknowledgements" ADD CONSTRAINT "policy_acknowledgements_programme_enrolment_id_programme_enrolments_id_fk" FOREIGN KEY ("programme_enrolment_id") REFERENCES "public"."programme_enrolments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_courses" ADD CONSTRAINT "programme_courses_programme_id_academic_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."academic_programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_courses" ADD CONSTRAINT "programme_courses_pathway_id_programme_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."programme_pathways"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_courses" ADD CONSTRAINT "programme_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_enrolments" ADD CONSTRAINT "programme_enrolments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_enrolments" ADD CONSTRAINT "programme_enrolments_programme_id_academic_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."academic_programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_enrolments" ADD CONSTRAINT "programme_enrolments_pathway_id_programme_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."programme_pathways"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_enrolments" ADD CONSTRAINT "programme_enrolments_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_pathways" ADD CONSTRAINT "programme_pathways_programme_id_academic_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."academic_programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_bookings" ADD CONSTRAINT "session_bookings_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_bookings" ADD CONSTRAINT "session_bookings_programme_enrolment_id_programme_enrolments_id_fk" FOREIGN KEY ("programme_enrolment_id") REFERENCES "public"."programme_enrolments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_bookings" ADD CONSTRAINT "session_bookings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_notification_dispatches_key" ON "notification_dispatches" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_status" ON "notification_dispatches" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_lease" ON "notification_dispatches" USING btree ("status","lease_expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_retry" ON "notification_dispatches" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_academic_programmes_code" ON "academic_programmes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_session_student_attendance" ON "attendance_records" USING btree ("session_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_campuses_slug" ON "campuses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_class_sessions_cohort_date" ON "class_sessions" USING btree ("cohort_id","session_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_class_sessions_inst_date" ON "class_sessions" USING btree ("instructor_id","session_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_classrooms_campus" ON "classrooms" USING btree ("campus_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_cohort_student" ON "cohort_memberships" USING btree ("cohort_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_cohorts_code" ON "cohorts" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cohorts_prog_arr" ON "cohorts" USING btree ("programme_id","delivery_arrangement");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_policy_ack_user" ON "policy_acknowledgements" USING btree ("user_id","policy_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_programme_course" ON "programme_courses" USING btree ("programme_id","pathway_id","course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_programme_courses_prog" ON "programme_courses" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prog_enrol_student" ON "programme_enrolments" USING btree ("student_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prog_enrol_cohort" ON "programme_enrolments" USING btree ("cohort_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_programme_pathways_code" ON "programme_pathways" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_programme_pathways_programme" ON "programme_pathways" USING btree ("programme_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_session_student_booking" ON "session_bookings" USING btree ("session_id","student_id");