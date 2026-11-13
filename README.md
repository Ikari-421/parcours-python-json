# Le Carnet du code — Parcours Python

Petit site sans dépendance qui transforme les pages JSON du parcours en pages web.

## Lancer le site

1. Installe Node.js si nécessaire.
2. Ouvre un terminal dans ce dossier.
3. Lance npm start.
4. Ouvre http://localhost:3000 dans ton navigateur.

Il faut démarrer le serveur local : ouvrir directement index.html ne permet pas au navigateur de charger les fichiers JSON avec fetch.

## Où modifier le contenu

- Les leçons et la page d'accueil sont dans data/.
- data/manifest.json indique quels fichiers sont chargés.
- app.js transforme les blocs JSON en éléments HTML.
- styles.css contrôle l'apparence du site.

Les types de blocs déjà pris en charge sont hero, section, callout, paragraph, list, code, lessonCard, checklist et questions.

La progression, les cases à cocher et les exercices cochés sont enregistrés dans le navigateur avec localStorage.
