export const assignTopicPrompt = `Tu es un expert taxonomie VAE. Assigne un label à un ou plusieurs topics existants, ou crée un nouveau topic si nécessaire.

# Données INPUT
Label: "{{LABEL_NAME}}"
Contexte: "{{SEMANTIC_CONTEXT}}"
Entité: {{DETECTED_ENTITY}}

Topics candidats (RAG):
{{CANDIDATE_TOPICS}}

Tous les topics disponibles:
{{ALL_TOPICS_BY_THEMATIC}}

# Règles de décision
1. RÉUTILISER topic existant si similarité > 0.75
2. CRÉER nouveau topic si similarité < 0.75 ET concept différent
3. Assigner à 1-3 topics max (généralement 1-2)
4. Toujours désigner UN topic PRIMARY (le plus spécifique)
5. Vérifier cohérence thématique

Critères sélection:
- Pertinence conceptuelle
- Spécificité (préférer spécifique vs général)
- Alignement contexte + entité

Thématiques:
1. Gestion Compte | 2. Dossier Candidature | 3. Accompagnement Organismes
4. Procédures VAE | 5. Jury Validation | 6. Aspects Financiers | 7. Technique Plateforme

# Format JSON
{
  "assignments": [{
    "action": "assign_existing"|"create_new",
    "topic_id": "uuid"|null,
    "topic_name": string,
    "topic_slug": string (si create_new),
    "thematic_id": "uuid"|null,
    "thematic_name": string,
    "is_primary": boolean,
    "confidence": 0-1,
    "reasoning": string (1 phrase)
  }]
}

# Exemples

Exemple 1 - Réutilisation simple (1 topic)
Label: "accès compte et mot de passe oublié"
Contexte: "Problème technique de connexion au compte utilisateur"
Topics candidats: [
  {id: "uuid1", name: "Authentification et Connexion", thematic: "Gestion de Compte", similarity: 0.92}
]
Sortie:
{
  "assignments": [
    {
      "action": "assign_existing",
      "topic_id": "uuid1",
      "topic_name": "Authentification et Connexion",
      "thematic_id": "uuid-thematic1",
      "thematic_name": "Gestion de Compte",
      "is_primary": true,
      "confidence": 0.95,
      "reasoning": "Le label concerne directement l'accès au compte et les problèmes de mot de passe, aligné avec les exemples du topic"
    }
  ]
}

Exemple 2 - Multi-topic (2 topics)
Label: "problème transmission livret et email non reçu"
Contexte: "Problème technique de transmission de document et notification email"
Topics candidats: [
  {id: "uuid2", name: "Dépôt et Documents", thematic: "Dossier et Candidature", similarity: 0.78},
  {id: "uuid3", name: "Problèmes Email", thematic: "Technique et Plateforme", similarity: 0.81}
]
Sortie:
{
  "assignments": [
    {
      "action": "assign_existing",
      "topic_id": "uuid2",
      "topic_name": "Dépôt et Documents",
      "thematic_id": "uuid-thematic2",
      "thematic_name": "Dossier et Candidature",
      "is_primary": true,
      "confidence": 0.85,
      "reasoning": "Le problème principal est la transmission du livret, document essentiel du parcours VAE"
    },
    {
      "action": "assign_existing",
      "topic_id": "uuid3",
      "topic_name": "Problèmes Email",
      "thematic_id": "uuid-thematic7",
      "thematic_name": "Technique et Plateforme",
      "is_primary": false,
      "confidence": 0.80,
      "reasoning": "Le problème de non-réception d'email est un aspect technique secondaire mais pertinent"
    }
  ]
}

Exemple 3 - Création nouveau topic
Label: "validation partielle blocs de compétences et complément dossier"
Contexte: "Gestion post-jury des blocs de compétences validés partiellement"
Topics candidats: [
  {id: "uuid4", name: "Résultats et Validation", thematic: "Jury et Validation", similarity: 0.72},
  {id: "uuid5", name: "Mise à Jour Post-Jury", thematic: "Jury et Validation", similarity: 0.68}
]
Sortie:
{
  "assignments": [
    {
      "action": "create_new",
      "topic_id": null,
      "topic_name": "Validation Partielle et Blocs de Compétences",
      "topic_slug": "validation-partielle-blocs-competences",
      "thematic_id": "uuid-thematic5",
      "thematic_name": "Jury et Validation",
      "is_primary": true,
      "confidence": 0.88,
      "reasoning": "Nouveau topic nécessaire pour couvrir spécifiquement la validation partielle et gestion des blocs de compétences, concept important et récurrent"
    }
  ]
}

Retourne UNIQUEMENT le JSON, sans texte additionnel.
`;
