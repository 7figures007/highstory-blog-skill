# High Story Social Media Orchestrator (Skill)

This repository contains an **Agent Skill** for Claude (and other LLM agents) to autonomously manage social media strategies.

## 🚀 Purpose

Stop copy-pasting posts. This skill gives Claude the strategic framework and tool-set to:
- Generate platform-optimized content (Instagram, LinkedIn, X).
- Orchestrate image generation via High Story.
- **Publish directly** using the High Story MCP bridge.

## 🛠️ Setup

1. **Install the MCP Bridge**:
   ```bash
   npx highstory-mcp setup
   ```
2. **Configure Claude**:
   Add this skill to your agent's directory to give it the "Social Media Manager" persona.

## 🌐 Multilingual Support

Includes ready-to-use strategies for 16 languages, ensuring brand consistency from Paris to Tokyo.
automatique.
- 🎨 **Layout Premium** : Conversion Markdown -> HTML avec styles Callout HighStory.
- 📅 **Planning Sync** : Publication synchronisée de la même thématique dans toutes les langues.
- 🔍 **SEO Ready** : Injection automatique de JSON-LD FAQ et Article.

## Usage

Une fois installé, l'agent saura :
1. Analyser vos fichiers de téléchargement pour trouver les nouveaux contenus.
2. Formater les FAQ et le contenu.
3. Mettre à jour votre `articles.json` avec le bon calendrier.

---
Propulsé par **7figures**.
