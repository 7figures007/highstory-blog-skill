# High Story Social Media Orchestrator (Skill)

This repository contains an **Agent Skill** for Claude (and other LLM agents) to autonomously manage social media strategies.

## 🚀 Purpose

Stop copy-pasting posts. This skill gives Claude the strategic framework and tool-set to:
- Generate platform-optimized content (Instagram, LinkedIn, X).
- Orchestrate image generation via High Story.
- **Publish directly** using the High Story MCP bridge.

## 🛠️ Step-by-Step Installation

### Étape 1 : Donner "le cerveau" à Claude (Les neurones)

Claude a besoin de lire les instructions professionnelles (`SKILL.md`) pour savoir comment agir.

*   **Option A : Claude sur le Web (Version Pro / Projets)**
    1.  Allez sur [Claude.ai](https://claude.ai) et créez un **Projet** (Bouton "Projects" dans la barre latérale).
    2.  Dans votre projet, cliquez sur **Add Content** puis **Upload Files**.
    3.  Sélectionnez le fichier `SKILL.md` contenu dans ce dossier.
    4.  C'est fini ! Claude possède désormais ses compétences de Manager RS.

*   **Option B : Claude Desktop / Installation Locale**
    1.  Déplacez ce dossier `highstory-social-media-manager` dans votre dossier **Documents**.
    2.  Dans votre chat Claude, dites-lui simplement : *"Lis et utilise les instructions dans le fichier SKILL.md de mon dossier Documents/highstory-social-media-manager"*.

### Étape 2 : Configurer le Bridge (La Connexion Technique)
1. Ouvrez votre terminal (Terminal sur Mac, PowerShell sur Windows).
2. Tapez la commande suivante et appuyez sur Entrée :
   ```bash
   npx highstory-mcp setup
   ```
3. Collez votre **Clé API permanente High Story** (que vous trouverez dans vos réglages High Story) quand cela est demandé.
4. Redémarrez complètement votre application Claude Desktop.

### Étape 3 : Utiliser Claude comme Manager RS
Demandez simplement à Claude :
> *"Utilise le skill High Story Social Media Orchestrator pour créer une campagne sur LinkedIn."*

## 🌐 Multilingual Support

Includes ready-to-use strategies for 16 languages, ensuring brand consistency from Paris to Tokyo.
