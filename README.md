# 📊 Support Conversations Labeling System

## 🎯 Objectif

Ce service catégorise automatiquement les conversations support (via Crisp) afin d’identifier les problématiques récurrentes et générer des statistiques fiables (tendances mensuelles, top sujets, etc.).

L’approche retenue est **Option 1 (delete/insert)** :
à chaque reprocessing d’une conversation, on supprime les anciennes associations labels ↔ conversation, et on réinsère uniquement les labels extraits lors de la dernière analyse.

---

## 🏗️ Stack Technique

- **Framework** : [NestJS](https://nestjs.com/) avec [Fastify](https://www.fastify.io/) (rapide et léger).
- **Langage** : TypeScript (strict mode).
- **LLM Integration** : [openai-agents-js](https://openai.github.io/openai-agents-js/).
- **Queue Processing** : [BullMQ](https://docs.bullmq.io/) + Redis (scalable, retries, rate limiting).
- **Database** : PostgreSQL 15+.
- **ORM** : [Drizzle ORM](https://orm.drizzle.team/) (migrations et typage).
- **Vector Store** : [pgvector](https://github.com/pgvector/pgvector).
- **Hashing** : SHA256 pour éviter les doublons.
- **Sécurité** : aucun stockage des messages en clair, seulement hash et métadonnées utiles.

---

## 🧩 Architecture

- AiModule : agents via `AgentsModule` → `LlmModule` → `AlbertModel` (HTTP vers `ALBERT_URL`).
- ConversationsModule : queue BullMQ `conversations` et worker `ConversationsProcessor` pour orchestrer le traitement.
- CrispModule : client HTTP Crisp (`CRISP_URL`, `CRISP_API_KEY`).
- DrizzleModule : provider PostgreSQL et schémas `conversations`, `labels`, `conversation_labels`.
- Config : validation Zod des variables d'env (Redis, DB, Crisp, LLM, limites et seuils).

---

## 🔒 Sécurité

- **Pas de stockage du texte brut** (RGPD / confidentialité).
- **Stockage minimal** : hash, conversation_id, labels.
- **Chiffrement** : Redis + PostgreSQL sur connexions TLS.
- **Monitoring** :
  - Logs sur traitements LLM (mais pas sur contenu).
  - Statut de job BullMQ (succès/échec).

---

## ⚙️ Flows de l’application

### 1. Webhook Crisp → API NestJS

- Endpoint `/webhooks/crisp/conversation.closed`.
- Payload minimal requis :
  - `conversation_id`
  - `messages[]` (texte brut concaténé + métadonnées)
- Traitement :
  1. Concaténer tous les messages (`role: user|support`) → texte complet.
  2. Calculer `hash = sha256(conversation_id + texte complet compacté)`.
  3. Vérifier si hash existe déjà en DB.
     - Si **oui** → conversation déjà traitée → stop.
     - Si **non** → push job dans BullMQ.

---

### 2. Queue (BullMQ)

- Queue `conversations` dans Redis.
- Paramètres :
  - `concurrency`: configurable (par défaut 5 workers).
  - `attempts`: 3 (retry max).
  - `backoff`: 30s exponential.
  - `limiter`: 60 jobs/min pour limiter les appels LLM.

---

### 3. Worker (BullMQ)

- Étapes du worker :
  1. Récupérer conversation complète depuis Crisp API (si besoin).
  2. Vérifier encore hash en DB (idempotence).
  3. Appeler `openai-agents-js` pour catégorisation.

---

### 4. Traitement LLM

- **Modèle recommandé** : `gpt-4o-mini` (équilibre coût/qualité).
- **Token limit** :
  - Compactage conversation → max 2k tokens.
  - Si > 2k → tronquer les plus anciens messages (les + vieux sont moins pertinents).
- **Prompt engineering** :
  - Objectif : générer des **labels courts (1-3 mots)**.
  - Règles :
    - Ne jamais inventer des labels inutiles.
    - Préférer des termes génériques : "paiement", "connexion", "commande".
    - Entre 1 et 5 labels max par conversation.
- **Similarité vectorielle** :
  - Recherche via pgvector.
  - Si `cosine_similarity >= 0.85` → réutiliser label existant.
  - Si `0.70 ≤ similarity < 0.85` → proposer un regroupement (stocké en `alias_of` mais garder trace).
  - Si `< 0.70` → créer un nouveau label.

---

### 5. Mise à jour en base

- Process delete/insert :
  1. Supprimer toutes les entrées `conversation_labels` de la conv.
  2. Pour chaque label généré :
     - Vérifier similarité.
     - Insérer nouveau label si nécessaire (embedding calculé une fois via `text-embedding-3-small`).
     - Créer la liaison `conversation_labels`.

---

### 6. Statistiques & Analyses

- Exemple : top 10 labels du mois courant :

  ```sql
  SELECT l.name, COUNT(*) as count
  FROM conversation_labels cl
  JOIN labels l ON cl.label_id = l.id
  WHERE cl.created_at >= DATE_TRUNC('month', NOW())
  GROUP BY l.name
  ORDER BY count DESC
  LIMIT 10;
  ```

- Tendances sur 6 mois :

```sql
SELECT DATE_TRUNC('month', cl.created_at) as month, l.name, COUNT(*) as count
FROM conversation_labels cl
JOIN labels l ON cl.label_id = l.id
GROUP BY month, l.name
ORDER BY month DESC, count DESC;
```

---

## 📉 Performance & Coût

### Volume attendu

- **1k → 10k conversations/mois**.

### LLM coût

- **gpt-4o-mini** ~0.06$/1k tokens (entrée) + ~0.24$/1k (sortie).
- **Conversation moyenne** : 1k tokens → ~0.10$/conv.
- **Pour 10k conv/mois** : ~1000$/mois.

### Optimisations

- **Batch par 5 conversations max** (si payload < 2k tokens).
- **Utiliser gpt-4o-mini** sauf cas complexes → fallback gpt-4o.

---

## ✅ Règles Importantes

### Similarité vectorielle

- **>= 0.85** : réutiliser label existant.
- **0.70 – 0.85** : alias ou regroupement manuel si nécessaire.
- **< 0.70** : nouveau label.

### Token limit

- **2000 tokens max** par appel.
- **Si plus** → tronquer le début.

### Labels générés

- **1–5 max**.
- **Toujours en minuscule**.
- **Pas d'emojis ni ponctuation**.

### Idempotence

- **Toujours vérifier hash** avant traitement.
- **Supprimer et réinsérer** labels liés à une conversation lors du reprocessing.

---

## 🛠️ Étapes de Réalisation de l'App

### 1. Initialisation projet

- NestJS + Fastify
- Drizzle + migrations PostgreSQL
- Redis + BullMQ
- pgvector extension

### 2. Webhook Crisp

- Endpoint `/webhooks/crisp/conversation.closed`
- Compactage des messages
- Hashing SHA256

### 3. Queue

- BullMQ setup
- Job processor `conversationsWorker`

### 4. LLM agent

- Implémentation avec openai-agents-js
- Prompt engineering
- Gestion token limit

### 5. DB Layer

- Modèles Drizzle pour conversations, labels, conversation_labels
- Méthodes insert/delete
- Recherche vectorielle via pgvector

### 6. Stats

- SQL queries pour top labels, tendances mensuelles
- (Optionnel) API `/stats` exposée en REST/GraphQL

### 7. Monitoring

- Bull Board pour jobs BullMQ
- Logs centralisés (pino + ELK ou Datadog)

### 8. Sécurité

- Ne jamais loguer contenu des conversations
- TLS activé
- Secrets stockés en Vault / dotenv

---

## 🧪 Exemple complet

**Conversation Crisp fermée** : "Je n'arrive pas à payer ma commande".

1. **Webhook** → hash SHA256 généré.
2. **Job ajouté** dans queue BullMQ.
3. **Worker appelle LLM** → `["paiement", "commande"]`.
4. **Recherche vectorielle** : les deux labels existent déjà → réutilisation.
5. **Suppression** des anciennes entrées `conversation_labels` → insertion des nouvelles.
6. **Statistiques mensuelles** prêtes via SQL.
