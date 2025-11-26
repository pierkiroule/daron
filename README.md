# 🔥 FIREMOOD du Daron

Rituel numérique de décharge émotionnelle — application web rapide, ludique et thérapeutique.

Émoji → sensation → intensité → lancer → transformation → phrase ressource.

---

## 🌋 Vision

FireMood du Daron est une application web pensée pour la régulation émotionnelle quotidienne. Simple, mobile-first et respectueuse de la vie privée, l'application transforme les ruminations en une expérience visuelle apaisante et symbolique.

Objectif : proposer un rituel accessible à tous (enfants, ados, adultes) sans collecte de données sensibles ni recours à des services d'IA externes.

### Résumé du rituel
1. Choisir un émoji qui représente le mood.
2. Indiquer une sensation corporelle.
3. Régler l'intensité (1–10).
4. Lancer les clones dans le FireMood.
5. Observer la transformation visuelle.
6. Recevoir une phrase ressource adaptée.

---

## 🧠 Principes thérapeutiques

- **Symbolisation émotionnelle** : donner forme à l'état intérieur.
- **Externalisation narrative** : séparer la pensée de l'identité.
- **Somatique → action → transformation** : geste + mouvement pour la régulation.
- **Micro-rituels d'auto-régulation** : pratique courte, répétable.

Pas d'analyse psychologique ni d'interprétation. Pas de stockage de données sensibles.

---

## 🖼️ Fonctionnalités principales

- **Choix du mood** : liste d'émojis universels (ex : 😔 😤 😵‍💫 😰 🌫️ 😡 🥀 😐).
- **Sensation corporelle** : lourdeur, chaleur, froid, nœud, vertige, pression, vide, tiraillement.
- **Intensité 1–10** : détermine le nombre de clones à lancer.
- **Rituel FireMood** : clones rebondissant, traînées lumineuses, zone de feu centrale, absorption.
- **Phrase ressource** : générée localement par le `DaronEngine`, sans IA distante.
- **Export PNG (à venir)** : sauvegarder la trace visuelle.
- **PWA / Offline (à venir)** : installation mobile, galerie locale.

Animation et règles clefs : chaque clone doit être lancé un par un, rebonds sur les bords, absorption déclenche la phrase ressource finale.

---

## 🧩 Architecture du projet

Structure proposée :

```
firemood/
  index.html
  vite.config.js
  package.json
  src/
    main.jsx
    App.jsx
    styles.css
    store.js
    engine/
      DaronEngine.js
    components/
      MoodScreen.jsx
      SensationScreen.jsx
      IntensityScreen.jsx
      FireMoodScreen.jsx
      FireMoodCanvas.jsx
      ResourceCard.jsx
```

Technos principales : `React` + `Vite`, Canvas 2D pour les effets légers, `zustand` pour le store minimaliste. Aucune dépendance lourde et pas de backend nécessaire pour la version initiale.

Pourquoi Canvas 2D ? Frugal, rapide, mobile-friendly, et suffisant pour un rituel visuel initial. Migration possible vers Pixi/Three.js pour FX avancés.

---

## 🛠️ Installation & démarrage (dev)

Prérequis : Node.js (v16+ recommandé) et `npm`.

Commandes de base :

```bash
# cloner le repo
git clone <URL_DU_REPO>
cd firemood

# installer les dépendances
npm install

# lancer en mode développement (Vite)
npm run dev
```

Vite ouvrira l'app sur `http://localhost:5173` par défaut.

Build de production :

```bash
npm run build
npm run preview
```

---

## ▶️ Tests manuels recommandés

- **Intensité → clones** : Intensité N génère N clones.
- **Traînée & rebonds** : clones rebondissent et laissent une traînée.
- **Absorption feu** : contact avec la zone feu fait disparaître le clone.
- **Transition** : lors du dernier clone absorbé, afficher la phrase ressource.
- **Accessibilité & mobile** : vérifier responsive et ergonomie tactile.

---

## 🔐 Sécurité & éthique

- Aucune collecte d'informations personnelles.
- Aucune IA distante utilisée.
- Contenu sûr : évitement de thèmes violents ou déclenchants.
- Destiné à accompagner, non à remplacer une aide professionnelle.

---

## 📦 Roadmap (priorisée)

- **v1 (actuelle)** : émoji → sensation → intensité → lancer → absorption → phrase ressource.
- **v2** : vibrations (Vibration API), bruitages doux, export PNG.
- **v3** : FX avancés (particles/shaders), audio-reactivity, capture vidéo.
- **v4** : PWA complète, galerie locale, rituels quotidiens.

---

## ❤️ Auteurs

Projet initié par Pierre‑Henri Garnier (psychologue, cyberpsychologue). Développement web assisté par des outils d'aide au code.

---

## 🌟 Licence

Usage libre pour un usage personnel et éducatif. Toute commercialisation ou fork public exige une demande d'autorisation préalable auprès de l'auteur.

---

## 🔥 Pourquoi “Daron” ?

Parce que le rituel est direct, bienveillant et rassurant — comme un vieux sage numérique qui te renvoie une phrase simple, cash et apaisante.

---

## ✨ Besoin d'autres livrables ?

Je peux générer :
- une version anglaise du `README.md`
- un logo SVG officiel
- une cover (image) optimisée pour GitHub
- un pitch commercial / page landing

Dites-moi ce que vous souhaitez, et je le crée.
