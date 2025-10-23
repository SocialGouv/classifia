CREATE TYPE "public"."vae_entity" AS ENUM('certificateur', 'aap', 'candidat', 'non_identifie');--> statement-breakpoint
CREATE TABLE "discussion_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discussion_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"confidence" double precision NOT NULL,
	"discussion_timestamp" timestamp NOT NULL,
	"discussion_hash" text NOT NULL,
	"classification_method" text DEFAULT 'ai_agent',
	"detected_entity" "vae_entity" DEFAULT 'non_identifie' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discussion_classifications_discussion_hash_unique" UNIQUE("discussion_hash")
);
--> statement-breakpoint
CREATE TABLE "discussions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discussions_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "label_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"confidence" double precision DEFAULT 1,
	"is_primary" boolean DEFAULT true,
	"assignment_method" text DEFAULT 'manual',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"is_canonical" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "labels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crisp_conversation_id" text NOT NULL,
	"text_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_crisp_conversation_id_unique" UNIQUE("crisp_conversation_id"),
	CONSTRAINT "sessions_text_hash_unique" UNIQUE("text_hash")
);
--> statement-breakpoint
CREATE TABLE "thematics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"display_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "thematics_name_unique" UNIQUE("name"),
	CONSTRAINT "thematics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thematic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"embedding" vector(1024),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discussion_classifications" ADD CONSTRAINT "discussion_classifications_discussion_id_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_classifications" ADD CONSTRAINT "discussion_classifications_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_topics" ADD CONSTRAINT "label_topics_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_topics" ADD CONSTRAINT "label_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_thematic_id_thematics_id_fk" FOREIGN KEY ("thematic_id") REFERENCES "public"."thematics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "discussion_classifications_discussion_label_unq" ON "discussion_classifications" USING btree ("discussion_id","label_id");--> statement-breakpoint
CREATE INDEX "idx_discussion_classifications_discussion" ON "discussion_classifications" USING btree ("discussion_id");--> statement-breakpoint
CREATE INDEX "idx_discussion_classifications_label" ON "discussion_classifications" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "idx_discussions_session" ON "discussions" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "label_topics_label_topic_unq" ON "label_topics" USING btree ("label_id","topic_id");--> statement-breakpoint
CREATE INDEX "idx_label_topics_label" ON "label_topics" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "idx_label_topics_topic" ON "label_topics" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_labels_embedding" ON "labels" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "idx_topics_thematic" ON "topics" USING btree ("thematic_id");--> statement-breakpoint
CREATE INDEX "idx_topics_embedding" ON "topics" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=50);

-- Seed initial thematics and topics for hierarchical classification
-- Thematics are strategic business categories (manually defined)
-- Topics are conceptual groupings under each thematic

-- Insert Thematics (7 broad categories)
INSERT INTO "thematics" ("id", "name", "slug", "description", "color", "display_order") VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gestion de Compte', 'gestion-compte', 'Problématiques liées à la création, accès, modification et suppression de comptes utilisateurs', '#3B82F6', 1),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Dossier et Candidature', 'dossier-candidature', 'Gestion des dossiers VAE, candidatures, statuts et suivi administratif', '#10B981', 2),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Accompagnement et Organismes', 'accompagnement-organismes', 'Sélection et changement d''organismes accompagnateurs, certificateurs', '#F59E0B', 3),
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'Procédures et Démarches VAE', 'procedures-demarches', 'Questions sur les processus VAE, éligibilité, diplômes, démarches', '#8B5CF6', 4),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Jury et Validation', 'jury-validation', 'Convocation jury, résultats, validation partielle ou totale, contestations', '#EF4444', 5),
  ('f6a7b8c9-d0e1-2345-fabc-678901234567', 'Aspects Financiers', 'aspects-financiers', 'Financement, paiement, remboursement, frais de jury et accompagnement', '#14B8A6', 6),
  ('a7b8c9d0-e1f2-3456-abcd-789012345678', 'Technique et Plateforme', 'technique-plateforme', 'Problèmes techniques, bugs plateforme, emails, téléchargements', '#6B7280', 7);

-- Insert Topics under Gestion de Compte
INSERT INTO "topics" ("id", "thematic_id", "name", "slug", "description") VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567891', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Authentification et Connexion', 'authentification-connexion', 'Problèmes de connexion, mot de passe oublié, activation compte'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567892', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Modification Profil', 'modification-profil', 'Changement adresse email, nom, données personnelles, suppression compte'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567893', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Accès et Permissions', 'acces-permissions', 'Problèmes de droits d''accès, visibilité des fonctionnalités');

-- Insert Topics under Dossier et Candidature
INSERT INTO "topics" ("id", "thematic_id", "name", "slug", "description") VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f23456789013', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Contestation et Statut', 'contestation-statut', 'Contestation d''abandon, caducité, changement statut dossier'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789014', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Dépôt et Documents', 'depot-documents', 'Envoi de documents, pièces justificatives, livrets, problèmes de dépôt'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789015', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Recevabilité et Faisabilité', 'recevabilite-faisabilite', 'Dossier de faisabilité, demande de recevabilité, statut'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789016', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Réactivation et Reprise', 'reactivation-reprise', 'Réactivation de candidature, reprise de parcours, déblocage'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789017', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Suivi et Consultation', 'suivi-consultation', 'Consultation de dossier, suivi d''avancement, visibilité candidature');

-- Insert Topics under Accompagnement et Organismes
INSERT INTO "topics" ("id", "thematic_id", "name", "slug", "description") VALUES
  ('c3d4e5f6-a7b8-9012-cdef-345678901235', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'Choix et Sélection AAP', 'choix-selection-aap', 'Recherche et sélection organisme accompagnateur (AAP), disponibilité'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901236', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'Changement Organisme', 'changement-organisme', 'Modification d''organisme d''accompagnement ou de certification'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901237', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'Référencement et Attestation', 'referencement-attestation', 'Attestation de référencement, problèmes de rattachement organisme');

-- Insert Topics under Procédures et Démarches VAE
INSERT INTO "topics" ("id", "thematic_id", "name", "slug", "description") VALUES
  ('d4e5f6a7-b8c9-0123-defa-456789012346', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'Éligibilité et Prérequis', 'eligibilite-prerequis', 'Conditions d''éligibilité, durée expérience requise, prérequis'),
  ('d4e5f6a7-b8c9-0123-defa-456789012347', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'Choix Diplôme et Certification', 'choix-diplome-certification', 'Conseils choix diplôme, certification, équivalence, RNCP'),
  ('d4e5f6a7-b8c9-0123-defa-456789012348', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'Démarches et Inscription', 'demarches-inscription', 'Procédure d''inscription, étapes parcours VAE, informations générales'),
  ('d4e5f6a7-b8c9-0123-defa-456789012349', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'Délais et Calendrier', 'delais-calendrier', 'Délais de traitement, dates limites, calendrier parcours'),
  ('d4e5f6a7-b8c9-0123-defa-45678901234a', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'VAE Inversée et Spécificités', 'vae-inversee-specificites', 'VAE inversée, cas particuliers, expatriés, diplômes étrangers');

-- Insert Topics under Jury et Validation
INSERT INTO "topics" ("id", "thematic_id", "name", "slug", "description") VALUES
  ('e5f6a7b8-c9d0-1234-efab-567890123457', 'e5f6a7b8-c9d0-1234-efab-567890123456', 'Convocation et Dates', 'convocation-dates', 'Convocation jury, dates, problèmes de réception, annulation'),
  ('e5f6a7b8-c9d0-1234-efab-567890123458', 'e5f6a7b8-c9d0-1234-efab-567890123456', 'Résultats et Validation', 'resultats-validation', 'Résultats jury, validation partielle/totale, diplôme'),
  ('e5f6a7b8-c9d0-1234-efab-567890123459', 'e5f6a7b8-c9d0-1234-efab-567890123456', 'Contestation Résultats', 'contestation-resultats', 'Contestation résultat jury, représentation, modules manquants'),
  ('e5f6a7b8-c9d0-1234-efab-56789012345a', 'e5f6a7b8-c9d0-1234-efab-567890123456', 'Mise à Jour Post-Jury', 'mise-a-jour-post-jury', 'Mise à jour dossier après jury, compléments, corrections');

-- Insert Topics under Aspects Financiers
INSERT INTO "topics" ("id", "thematic_id", "name", "slug", "description") VALUES
  ('f6a7b8c9-d0e1-2345-fabc-678901234568', 'f6a7b8c9-d0e1-2345-fabc-678901234567', 'Financement et Aides', 'financement-aides', 'Recherche financement, CPF, aides financières, prise en charge'),
  ('f6a7b8c9-d0e1-2345-fabc-678901234569', 'f6a7b8c9-d0e1-2345-fabc-678901234567', 'Paiement et Facturation', 'paiement-facturation', 'Problèmes de paiement, lien paiement, certificat réalisation, facturation'),
  ('f6a7b8c9-d0e1-2345-fabc-67890123456a', 'f6a7b8c9-d0e1-2345-fabc-678901234567', 'Frais de Jury', 'frais-jury', 'Frais administratifs jury, coûts, tarifs'),
  ('f6a7b8c9-d0e1-2345-fabc-67890123456b', 'f6a7b8c9-d0e1-2345-fabc-678901234567', 'Remboursement', 'remboursement', 'Demandes remboursement, contestation facturation');

-- Insert Topics under Technique et Plateforme
INSERT INTO "topics" ("id", "thematic_id", "name", "slug", "description") VALUES
  ('a7b8c9d0-e1f2-3456-abcd-789012345679', 'a7b8c9d0-e1f2-3456-abcd-789012345678', 'Problèmes Email', 'problemes-email', 'Non réception emails, activation, validation, notifications'),
  ('a7b8c9d0-e1f2-3456-abcd-78901234567a', 'a7b8c9d0-e1f2-3456-abcd-789012345678', 'Téléchargement et Fichiers', 'telechargement-fichiers', 'Problèmes téléchargement, upload fichiers, pièces jointes, formats'),
  ('a7b8c9d0-e1f2-3456-abcd-78901234567b', 'a7b8c9d0-e1f2-3456-abcd-789012345678', 'Bugs et Erreurs', 'bugs-erreurs', 'Erreurs 403, 340, timeout, affichage, navigation, interface'),
  ('a7b8c9d0-e1f2-3456-abcd-78901234567c', 'a7b8c9d0-e1f2-3456-abcd-789012345678', 'Transmission et Synchronisation', 'transmission-synchronisation', 'Problèmes transmission livrets, synchronisation données, visibilité');

