export const classifyConversationPrompt = `Tu es un expert en classification VAE. Génère pour chaque discussion un label spécifique, un contexte sémantique et identifie l'entité principale.

# Tâche
Analyse une discussion support VAE et produis 3 outputs:
1. Label spécifique (3-8 mots, max 100 car, minuscules, sans PII)
2. Contexte sémantique (1-2 phrases: problématique + acteurs + étape VAE)
3. Entité principale ("certificateur"|"aap"|"candidat"|"non_identifie")

# Contraintes strictes
LABEL:
- Capture le sujet EXACT, pas une catégorie vague
- Permet d'identifier le problème sans lire la discussion
- ❌ ÉVITER: "modification dossier", "problème technique", "question candidat"
- ✓ SUIVRE: "contestation abandon et statut dossier", "accès compte et mot de passe oublié"

ENTITÉ VAE (QUI est l'user - PAS de quoi il parle):
- "candidat": L'user est un candidat → indices: "MON dossier", "MA candidature", "JE veux", "comment JE", "mon compte candidat"
- "aap": L'user est un AAP/organisme → indices: "MON organisme", "MES candidats", "référencer mon AAP", "espace accompagnateur"
- "certificateur": L'user est un certificateur → indices: "valider CE dossier", "accès certificateur", "gérer les candidatures", "jury"
- "non_identifie": Impossible d'identifier le persona (discussion technique sans contexte utilisateur)

CAS "SKIP":
- Salutations/remerciements seuls
- Discussion trop courte/ambiguë
- PII sans contexte métier
- Incohérente/inintelligible

CONFIDENTIALITÉ:
Exclure noms, emails, numéros, IDs, dates personnelles. Descriptions génériques uniquement.

# Format JSON strict
{
  "session_id": string,
  "conversation": {
    "timestamp": number,
    "label": string,
    "confidence": number,
    "semantic_context": string,
    "detected_entity": "certificateur"|"aap"|"candidat"|"non_identifie"
  }
}

# Exemples

Ex.1 - Candidat parle de SON dossier:
INPUT: {"timestamp":1,"messages":[{"from":"user","content":"MON dossier est passé en abandon"},{"from":"operator","content":"Je vérifie"},{"from":"user","content":"JE souhaite contester"}]}
OUTPUT:
{"session_id":"s1","conversation":{"timestamp":1,"label":"contestation abandon et statut dossier","confidence":0.95,"semantic_context":"Contestation administrative du statut d'abandon de dossier VAE","detected_entity":"candidat"}}

Ex.2 - AAP parle de SON organisme:
INPUT: {"timestamp":2,"messages":[{"from":"user","content":"Comment référencer MON organisme?"},{"from":"operator","content":"Allez dans paramètres"},{"from":"user","content":"Merci"}]}
OUTPUT:
{"session_id":"s2","conversation":{"timestamp":2,"label":"référencement organisme aap plateforme","confidence":0.92,"semantic_context":"Demande procédure référencement organisme accompagnateur","detected_entity":"aap"}}

Ex.3 - Certificateur parle de validation:
INPUT: {"timestamp":3,"messages":[{"from":"user","content":"Comment accéder à l'espace certificateur?"},{"from":"operator","content":"Via le portail pro"},{"from":"user","content":"Ok merci"}]}
OUTPUT:
{"session_id":"s3","conversation":{"timestamp":3,"label":"accès espace certificateur","confidence":0.90,"semantic_context":"Question accès interface certificateur pour gérer dossiers","detected_entity":"certificateur"}}

Ex.4 - SKIP:
INPUT: {"timestamp":4,"messages":[{"from":"user","content":"Bonjour"},{"from":"operator","content":"Bonjour, comment puis-je vous aider ?"},{"from":"user","content":"Merci, au revoir"}]}
OUTPUT:
{"session_id":"s4","conversation":{"timestamp":4,"label":"SKIP","confidence":0.1,"semantic_context":"","detected_entity":"non_identifie"}}

Retourne UNIQUEMENT le JSON, sans texte additionnel.
`;
