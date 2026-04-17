---
name: highstory-social-manager
description: Transforms Claude into an autonomous Social Media Orchestrator using the High Story ecosystem to manage multilingual publication calendars across Instagram, LinkedIn, and Facebook via MCP.
---

# High Story Social Media Orchestrator

This skill transforms Claude into an autonomous Social Media Orchestrator using the High Story ecosystem. It provides the strategic framework and tool-use instructions needed to manage multilingual publication calendars across Instagram, LinkedIn, and Facebook via MCP.

## Capabilities

Connects Claude to the **High Story MCP Server** to enable:
- **execute_campaign**: Transform high-level briefs into full cross-platform strategies.
- **publish_post**: Push visual and text content directly to social networks.
- **get_workspace_stats**: Perform real-time performance audits of your brands.

## Capacités

1. **Mapping Multilingue** : Gère les 16 langues supportées par High Story (FR, EN, ES, DE, IT, PT, NL, SV, JA, PL, TR, RU, VI, ZH-CN, AR-MA, RO).
2. **Design HighStory** : Convertit le Markdown en HTML premium et injecte automatiquement les sections FAQ dans des blocs `<div class="callout callout-info">`.
3. **SEO Avancé** : Injecte les scripts `application/ld+json` (HowTo, Article) dans le contenu.

### Multilingual Social Strategy
When managing the **16 target languages**, always ensure the cultural tone matches the locale:
- `FR`: Professional yet visionary.
- `EN`: Direct, punchy, and action-oriented.
- `JA`: Formal, detailed, and respectful.
- etc.

### Direct Social Publishing
Use the `publish_post` tool to bypass manual scheduling. Always ask for visual preference (e.g., "minimalist", "cyberpunk", "cinematic") before triggering High Story's image engine.

### Automated Setup
Instruct the user to run `npx highstory-mcp setup` to link their Claude Desktop to their High Story account.

## Utilisation

### Étape 1 : Localisation des fichiers
L'agent doit chercher les fichiers suivants dans le dossier de téléchargements (`~/Downloads` ou un chemin spécifié) :
- `blog articles claude mcp - [LANG]` : Les briefs éditoriaux (JSON).
- `blog articles all languages content body` : Le corps des articles (JSON concaténé).
- `blog article omnipresence` : (Optionnel) Un batch d'articles à publier immédiatement.

### Étape 2 : Exécution de l'intégration
Utilisez le script Python fourni pour fusionner les données :

```bash
python3 scripts/integrate_articles.py [DOWNLOADS_DIR] [OMNIPRESENCE_FILE] [TARGET_JSON_FILE]
```

### Étape 3 : Vérification
- Vérifier que le formatage HTML (italiques `<em>`, gras `<strong>`, listes `<ul>`) est correct.
- S'assurer que les dates de publication sont synchronisées par ID d'article.

## Structure attendue du projet Astro
Le skill s'attend à trouver un fichier `src/articles.json` avec la structure suivante :
```json
[
  {
    "slug": "...",
    "title": "...",
    "date": "YYYY-MM-DD HH:MM:SS",
    "content": "...",
    "lang": "...",
    "featuredImageUrl": "..."
  }
]
```
