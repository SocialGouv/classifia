# VAE-CRISP: Conversation Classification System

Automatic conversation classification service for Crisp support messages. Uses LLM-based analysis to categorize conversations into subjects/topics with vector similarity matching to identify recurring issues and generate analytics.

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) with [Fastify](https://www.fastify.io/)
- **Language**: TypeScript
- **LLM**: Albert API (French government AI) via Vercel AI SDK
- **Queue**: [BullMQ](https://docs.bullmq.io/) with Redis
- **Database**: PostgreSQL 16+ with [Drizzle ORM](https://orm.drizzle.team/)
- **Vector Store**: [pgvector](https://github.com/pgvector/pgvector)
- **Security**: SHA256 hashing, no plaintext message storage

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose

### Installation

1. Clone and install dependencies:

```bash
pnpm install
```

1. Copy environment variables:

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

1. Start infrastructure (PostgreSQL + Redis):

```bash
pnpm docker:up
```

1. Run database migrations:

```bash
pnpm db:push
```

1. Start development server:

```bash
pnpm start:dev
```

The API will be available at `http://localhost:3000`

## Environment Variables

See `.env.example` for all required configuration. Key variables:

- `ALBERT_API_KEY` - Albert LLM API key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `CRISP_API_KEY`, `CRISP_URL` - Crisp API credentials
- `VECTOR_SIMILARITY_REUSE` - Threshold for reusing existing subjects (default: 0.85)
- `VECTOR_SIMILARITY_ALIAS` - Threshold for creating subject aliases (default: 0.70)

## API Endpoints

### Health Check

```http
GET /health
```

Returns service health status.

### Conversations

```http
GET /conversations
```

Fetch all conversations from Crisp.

```http
GET /conversations/:conversation_id
```

Fetch specific conversation messages.

```http
POST /conversations
Body: { "conversation_id": "session_123" }
```

Queue a conversation for classification processing.

## Architecture

### Modules

- **AiModule**: LLM integration and classification agents
  - `AgentsModule`: Classification agent implementations
  - `LlmModule`: Albert chat and embedding models
  - Adapters: Vercel AI, LangChain, OpenAI Agents, VoltAgent
- **ConversationsModule**: Core conversation processing logic
  - Controller: HTTP endpoints
  - Service: Business logic and classification orchestration
  - Processors: BullMQ job workers
- **CrispModule**: Crisp API client integration

- **DrizzleModule**: Database layer with PostgreSQL + pgvector
  - Schemas: `conversations`, `subjects`, `conversation_subjects`

### Database Schema

#### conversations

- `id` (uuid, PK)
- `crisp_conversation_id` (text, unique)
- `text_hash` (text, unique) - SHA256 of conversation content
- `created_at` (timestamp)

#### subjects

- `id` (uuid, PK)
- `name` (text, unique)
- `embedding` (vector[1024]) - pgvector embedding
- `alias_of` (uuid, FK) - References parent subject for aliases
- `created_at` (timestamp)

#### conversation_subjects

Join table linking conversations to subjects:

- `id` (uuid, PK)
- `conversation_id` (uuid, FK)
- `subject_id` (uuid, FK)
- `confidence` (double) - Classification confidence score
- `conversation_timestamp` (timestamp)
- `conversation_hash` (text, unique) - Hash of discussion segment
- `created_at` (timestamp)

## Classification Flow

1. **Receive conversation ID** via POST `/conversations`
2. **Queue job** in BullMQ for async processing
3. **Fetch messages** from Crisp API
4. **Split into discussions** (continuous message exchanges)
5. **Hash check** - Skip if discussion hash already processed
6. **LLM classification** - Generate subject description
7. **Vector similarity search** using pgvector:
   - `>= 0.85` similarity: Reuse existing subject
   - `0.70-0.85`: Create alias subject linked to parent
   - `< 0.70`: Create new subject
8. **Store association** in `conversation_subjects`

### Deduplication Strategy

- **Conversation level**: SHA256 hash of full conversation content
- **Discussion level**: SHA256 hash of individual discussion segments
- Ensures idempotency even when conversations are reprocessed

### Vector Similarity

Uses cosine similarity via pgvector to match semantically similar subjects. Thresholds are configurable via environment variables.

## Development

```bash
# Development with watch mode
pnpm start:dev

# Production build
pnpm build
pnpm start:prod

# Run linter
pnpm lint

# Format code
pnpm format

# Database operations
pnpm db:generate  # Generate migrations
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
```

## Docker

```bash
# Start all services (PostgreSQL + Redis)
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down

# Clean volumes and restart
pnpm docker:clean
pnpm docker:up
```

## Production Deployment

Build and run with Docker:

```bash
docker build -t vae-crisp .
docker run -p 3000:3000 --env-file .env vae-crisp
```

Or use the provided `docker-compose.yml` for full stack deployment.

## Security & Privacy

- **No plaintext storage**: Messages are never stored, only hashes and metadata
- **Confidentiality**: LLM prompts explicitly forbid PII in generated subjects
- **Idempotency**: Hash-based deduplication prevents duplicate processing
- **TLS**: All external connections should use TLS in production

## License

MIT
