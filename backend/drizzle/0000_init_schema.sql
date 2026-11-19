CREATE TYPE "public"."application_member_role" AS ENUM('LEAD', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('PENDING', 'REVIEWING', 'INTERVIEW', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."company_verification" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."connection_request_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('JUNIOR', 'MIDDLE', 'SENIOR');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('FULL_TIME', 'PART_TIME', 'PROJECT', 'VOLUNTEER', 'UNPAID_INTERNSHIP');--> statement-breakpoint
CREATE TYPE "public"."importance_level" AS ENUM('CRITICAL', 'IMPORTANT', 'OPTIONAL');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('APPLICATION_STATUS_CHANGED', 'NEW_APPLICATION', 'INTERVIEW_INVITE', 'FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."proficiency_level" AS ENUM('BASIC', 'INTERMEDIATE', 'ADVANCED');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('INTERNSHIP', 'VKR', 'COURSE_PROJECT', 'COMMERCIAL', 'OPEN_SOURCE');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STUDENT', 'COMPANY', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."skill_category" AS ENUM('HARD', 'SOFT', 'LANGUAGE', 'TOOL');--> statement-breakpoint
CREATE TABLE "application_members" (
	"application_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"role" "application_member_role" DEFAULT 'MEMBER' NOT NULL,
	"ai_match_score" real,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"is_team" boolean DEFAULT false NOT NULL,
	"status" "application_status" DEFAULT 'PENDING' NOT NULL,
	"status_comment" text,
	"status_changed_at" timestamp with time zone,
	"status_changed_by" uuid,
	"ai_match_score" real,
	"ai_feedback" jsonb,
	"cover_letter" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"link" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"industry" varchar(255),
	"description" text,
	"website" varchar(255),
	"city" varchar(100) DEFAULT 'Кемерово',
	"address" text,
	"contact_person" varchar(255),
	"contact_role" varchar(255),
	"contact_email" varchar(255),
	"contact_telegram" varchar(100),
	"avatar_url" varchar(500),
	"verification_status" "company_verification" DEFAULT 'PENDING' NOT NULL,
	"verification_note" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"role" varchar(100),
	"technologies" jsonb DEFAULT '[]'::jsonb,
	"url" varchar(500),
	"started_at" date,
	"finished_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_skills" (
	"project_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"importance_level" "importance_level" DEFAULT 'IMPORTANT' NOT NULL,
	"min_proficiency_level" "proficiency_level" DEFAULT 'BASIC' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"expected_results" text,
	"conditions" text,
	"type" "project_type" DEFAULT 'INTERNSHIP' NOT NULL,
	"difficulty" "difficulty_level" DEFAULT 'JUNIOR' NOT NULL,
	"employment_type" "employment_type" DEFAULT 'PROJECT' NOT NULL,
	"status" "project_status" DEFAULT 'DRAFT' NOT NULL,
	"team_size" varchar(100) DEFAULT '1–3 студента',
	"city" varchar(100),
	"is_remote" boolean DEFAULT true NOT NULL,
	"deadline" timestamp with time zone,
	"embedding" vector(384),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"parsed_text" text,
	"ai_parsed_data" jsonb,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"category" "skill_category" DEFAULT 'HARD' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"status" "connection_request_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_connections_pair_check" CHECK (student_id < partner_id)
);
--> statement-breakpoint
CREATE TABLE "student_skills" (
	"student_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"proficiency_level" "proficiency_level" DEFAULT 'INTERMEDIATE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"university_group" varchar(100) NOT NULL,
	"year" varchar(50) NOT NULL,
	"university" varchar(255) DEFAULT 'КемГУ' NOT NULL,
	"specialization" varchar(255),
	"telegram" varchar(100),
	"city" varchar(100) DEFAULT 'Кемерово',
	"phone" varchar(30),
	"status" varchar(100) DEFAULT 'Готов к практике',
	"bio" text,
	"avatar_url" varchar(500),
	"embedding" vector(384),
	"ai_match_score" real,
	"ai_feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" varchar(20) NOT NULL,
	"source" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'STUDENT' NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_members" ADD CONSTRAINT "application_members_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_members" ADD CONSTRAINT "application_members_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_members" ADD CONSTRAINT "application_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_status_changed_by_users_id_fk" FOREIGN KEY ("status_changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_project_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."project_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_connections" ADD CONSTRAINT "student_connections_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_connections" ADD CONSTRAINT "student_connections_partner_id_students_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_connections" ADD CONSTRAINT "student_connections_requested_by_students_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_members_app_student_idx" ON "application_members" USING btree ("application_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "application_members_student_project_idx" ON "application_members" USING btree ("student_id","project_id");--> statement-breakpoint
CREATE INDEX "application_members_project_idx" ON "application_members" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_lead_unique_idx" ON "applications" USING btree ("project_id","student_id");--> statement-breakpoint
CREATE INDEX "applications_student_idx" ON "applications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "applications_project_status_idx" ON "applications" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "chats_application_idx" ON "chats" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "messages_chat_idx" ON "messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_user_id_idx" ON "organizations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizations_verification_idx" ON "organizations" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "portfolio_student_idx" ON "portfolio_items" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_skills_pk" ON "project_skills" USING btree ("project_id","skill_id");--> statement-breakpoint
CREATE INDEX "projects_org_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_type_idx" ON "projects" USING btree ("type");--> statement-breakpoint
CREATE INDEX "projects_difficulty_idx" ON "projects" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "projects_employment_idx" ON "projects" USING btree ("employment_type");--> statement-breakpoint
CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "resumes_student_idx" ON "resumes" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_name_idx" ON "skills" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_slug_idx" ON "skills" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "student_connections_pair_idx" ON "student_connections" USING btree ("student_id","partner_id");--> statement-breakpoint
CREATE INDEX "student_connections_student_idx" ON "student_connections" USING btree ("student_id","status");--> statement-breakpoint
CREATE INDEX "student_connections_partner_idx" ON "student_connections" USING btree ("partner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "student_skills_pk" ON "student_skills" USING btree ("student_id","skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_user_id_idx" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "students_specialization_idx" ON "students" USING btree ("specialization");--> statement-breakpoint
CREATE INDEX "system_logs_level_idx" ON "system_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "system_logs_created_idx" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");