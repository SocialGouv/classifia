# ClassifIA : Système de Classification de Conversations

![ClassifIA Logo](assets/classifia-logo.png)

**Projet Beta Gouv** - Service automatisé de classification de conversations pour les messages de support Crisp. Utilise l'analyse basée sur LLM pour catégoriser les conversations en sujets/thèmes avec correspondance de similarité vectorielle pour identifier les problèmes récurrents et générer des analyses.

## Stack Technique

- **Framework**: [NestJS](https://nestjs.com/) avec [Fastify](https://www.fastify.io/)
- **Langage**: TypeScript
- **LLM**: API Albert (IA du gouvernement français) via OpenAI Agents SDK
- **File d'attente**: [BullMQ](https://docs.bullmq.io/) avec Redis
- **Base de données**: PostgreSQL 16+ avec [Drizzle ORM](https://orm.drizzle.team/)
- **Stockage vectoriel**: [pgvector](https://github.com/pgvector/pgvector)
- **Sécurité**: Hachage SHA256, aucun stockage en texte clair

## Démarrage Rapide

### Prérequis

- Node.js 20+
- pnpm
- Docker & Docker Compose

### Installation

- **Cloner et installer les dépendances :**

```bash
pnpm install
```

- **Configurer les variables d'environnement :**

```bash
cp .env.example .env
# Éditer .env avec vos identifiants réels
```

- **Démarrer l'infrastructure (PostgreSQL + Redis) :**

```bash
pnpm docker:up
```

- **Exécuter les migrations de base de données :**

```bash
pnpm db:push
```

- **Démarrer le serveur de développement :**

```bash
pnpm start:dev
```

L'API sera accessible sur `http://localhost:3000`

## Variables d'Environnement

Voir `.env.example` pour la configuration complète requise. Variables clés :

- **Albert LLM**: `ALBERT_API_KEY`, `ALBERT_URL`
- **Base de données**: `DATABASE_URL` (PostgreSQL avec pgvector)
- **Redis**: `REDIS_HOST`, `REDIS_PORT`
- **Crisp API**: `CRISP_API_KEY`, `CRISP_URL`, `CRISP_WEBHOOK_SECRET`
- **Seuils de similarité**: `VECTOR_SIMILARITY_REUSE` (0.85), `VECTOR_SIMILARITY_ALIAS` (0.70)
- **BullMQ**: `BULLMQ_CONCURRENCY`, `BULLMQ_ATTEMPTS`, `BULLMQ_BACKOFF_DELAY`, `BULLMQ_RATE_LIMIT`
- **Limites de traitement**: `MAX_TOKENS_PER_CONVERSATION`, `MAX_LABELS_PER_CONVERSATION`

Consultez le fichier `.env.example` pour la documentation détaillée de chaque variable.

## Points de Terminaison API

### Vérification de Santé

```http
GET /health
```

Retourne le statut de santé du service.

### Conversations

```http
GET /conversations
```

Récupère toutes les conversations depuis Crisp.

**Paramètres de requête** :

- `filter_resolved` (optionnel) : Filtre pour les conversations résolues

```http
GET /conversations/:conversation_id
```

Récupère les messages d'une conversation spécifique.

```http
POST /conversations
Content-Type: application/x-www-form-urlencoded

conversation_id=session_123
```

Met en file d'attente une conversation pour traitement et classification.

### Webhook Crisp

```http
POST /crisp/webhook/message-updated?secret={CRISP_WEBHOOK_SECRET}
Content-Type: application/json
```

Reçoit les notifications de webhook de Crisp lors de la mise à jour de messages. Nécessite le secret webhook configuré dans `CRISP_WEBHOOK_SECRET`.

## Architecture

### Modules

- **AiModule**: Intégration LLM et agents de classification
  - `AgentsModule`: Implémentations d'agents de classification
  - `LlmModule`: Modèles de chat et d'embedding Albert
  - Adaptateurs : Vercel AI, LangChain, OpenAI Agents, VoltAgent
- **ConversationsModule**: Logique de traitement des conversations
  - Controller : Points de terminaison HTTP
  - Service : Logique métier et orchestration de classification
  - Processors : Workers de jobs BullMQ
- **CrispModule**: Intégration du client API Crisp
- **DrizzleModule**: Couche base de données avec PostgreSQL + pgvector
  - Schémas : `conversations`, `subjects`, `conversation_labels`

### Schéma de Base de Données

#### conversations

- `id` (uuid, PK)
- `crisp_conversation_id` (text, unique)
- `text_hash` (text, unique) - SHA256 du contenu de conversation
- `created_at` (timestamp)

#### subjects

- `id` (uuid, PK)
- `name` (text, unique)
- `embedding` (vector[1024]) - Embedding pgvector
- `alias_of` (uuid, FK) - Référence au sujet parent pour les alias
- `created_at` (timestamp)

#### conversation_labels

Table de jointure reliant les conversations aux sujets :

- `id` (uuid, PK)
- `conversation_id` (uuid, FK)
- `subject_id` (uuid, FK)
- `confidence` (double) - Score de confiance de classification
- `conversation_timestamp` (timestamp)
- `conversation_hash` (text, unique) - Hash du segment de discussion
- `created_at` (timestamp)

## Flux de Classification

1. **Réception de l'ID de conversation** via POST `/conversations`
2. **Mise en file d'attente** dans BullMQ pour traitement asynchrone
3. **Récupération des messages** depuis l'API Crisp
4. **Division en discussions** (échanges de messages continus)
5. **Vérification de hash** - Ignorer si le hash de discussion est déjà traité
6. **Classification LLM** - Génération de description du sujet
7. **Recherche de similarité vectorielle** avec pgvector :
   - `>= 0.85` similarité : Réutiliser le sujet existant
   - `0.70-0.85` : Créer un alias de sujet lié au parent
   - `< 0.70` : Créer un nouveau sujet
8. **Stockage de l'association** dans `conversation_labels`

### Stratégie de Déduplication

- **Niveau conversation** : Hash SHA256 du contenu complet de conversation
- **Niveau discussion** : Hash SHA256 des segments individuels de discussion
- Garantit l'idempotence même lorsque les conversations sont retraitées

### Similarité Vectorielle

Utilise la similarité cosinus via pgvector pour faire correspondre des sujets sémantiquement similaires. Les seuils sont configurables via les variables d'environnement.

## Développement

```bash
# Développement avec mode watch
pnpm start:dev

# Build de production
pnpm build
pnpm start:prod

# Exécuter le linter
pnpm lint

# Formater le code
pnpm format

# Opérations de base de données
pnpm db:generate  # Générer les migrations
pnpm db:push      # Pousser les changements de schéma
pnpm db:studio    # Ouvrir Drizzle Studio
```

## Docker

L'infrastructure Docker expose PostgreSQL sur le port **5999** et Redis sur le port **6999** (non les ports par défaut).

```bash
# Démarrer tous les services (PostgreSQL + Redis)
pnpm docker:up

# Voir les logs
pnpm docker:logs

# Arrêter les services
pnpm docker:down

# Nettoyer les volumes et redémarrer
pnpm docker:clean
pnpm docker:up
```

## Déploiement en Production

Build et exécution avec Docker :

```bash
docker build -t classifia .
docker run -p 3000:3000 --env-file .env classifia
```

Ou utiliser le `docker-compose.yml` fourni pour le déploiement de la stack complète.

## Sécurité & Confidentialité

- **Pas de stockage en texte clair** : Les messages ne sont jamais stockés, uniquement les hashes et métadonnées
- **Confidentialité** : Les prompts LLM interdisent explicitement les PII dans les sujets générés
- **Idempotence** : La déduplication basée sur hash empêche le traitement dupliqué
- **TLS** : Toutes les connexions externes doivent utiliser TLS en production

## À Propos

**ClassifIA** est un projet développé dans le cadre de [Beta Gouv](https://beta.gouv.fr/), l'incubateur de services numériques de l'État français.

## Licence

MIT
