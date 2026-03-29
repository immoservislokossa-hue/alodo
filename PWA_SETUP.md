# 📱 PWA Setup - ALODO

## ✅ Fichiers Créés

```
alodo-landing/
├── app/
│   ├── manifest.ts                 # Manifest PWA officiel (Next.js)
│   └── layout.tsx                  # Mise à jour: Metadata PWA + PWAProvider
│
├── src/
│   ├── components/
│   │   ├── PWAProvider.tsx          # Enregistrement Service Worker
│   │   └── InstallPWAButton.tsx     # Bouton d'installation
│   ├── lib/
│   │   └── register-sw.ts           # Logique d'enregistrement SW
│   └── hooks/
│       └── usePWAInstall.ts         # Hook: gestion installation
│
├── public/
│   ├── sw.js                        # Service Worker minimal
│   ├── offline.html                 # Page fallback hors ligne
│   ├── icon-192x192.png             # ⚠️ À CRÉER
│   └── icon-512x512.png             # ⚠️ À CRÉER
│
└── next.config.js                   # Mise à jour: Headers PWA
```

---

## 🎯 Étapes Restantes

### 1. Créer les Icônes PWA

**Vous DEVEZ créer 2 icônes PNG:**

- `public/icon-192x192.png` (192×192 pixels)
- `public/icon-512x512.png` (512×512 pixels)

**Recommandations:**
- Format: PNG avec transparence
- Logo ALODO au centre
- Utiliser les couleurs de marque (#008751 vert Bénin)
- Sans padding autour du logo

**Outils en ligne:**
- https://www.favicon-generator.org/
- https://maskable.app/editor
- https://pwa-asset-generator.netlify.app/

---

## 🔧 Intégration dans vos Pages

### Option 1: Bouton dans une NavBar

```tsx
// src/components/Navbar.tsx
import { InstallPWAButton } from '@/components/InstallPWAButton'

export function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4">
      <h1>ALODO</h1>
      <InstallPWAButton />
    </nav>
  )
}
```

### Option 2: Bouton Mobile (Pop-up bas)

```tsx
// Dans votre layout ou page principale
import { InstallPWAButtonMobile } from '@/components/InstallPWAButton'

export default function Page() {
  return (
    <>
      {/* Votre contenu */}
      <InstallPWAButtonMobile />
    </>
  )
}
```

### Option 3: Utiliser le Hook Personnalisé

```tsx
'use client'

import { usePWAInstall } from '@/hooks/usePWAInstall'

export function CustomInstallButton() {
  const { canInstall, isInstalling, install } = usePWAInstall()

  if (!canInstall) return null

  return (
    <button
      onClick={install}
      disabled={isInstalling}
      className="px-4 py-2 bg-green-600 text-white rounded"
    >
      {isInstalling ? 'Installation...' : 'Installer'}
    </button>
  )
}
```

---

## 🧪 Tester la PWA

### Navigateurs Supportés

- ✅ Chrome/Edge (Android)
- ✅ Firefox (Android)
- ✅ Samsung Internet
- ✅ Safari (15+, mais limité)

### Test en Local

```bash
# Build production
npm run build

# Lancer le serveur
npm start
```

**Puis ouvrir**: `http://localhost:3000`

### Dans DevTools

1. **F12 → Application**
2. **Service Workers tab** → Vérifier que sw.js est enregistré ✅
3. **Manifest tab** → Vérifier le manifest.json ✅
4. **Storage > Cache** → Vérifier le cache "alodo-v1" est créé ✅

---

## 🔍 Checklist Avant Production

- [ ] Icons PWA créées (192×192 et 512×512)
- [ ] Service Worker enregistré dans DevTools
- [ ] Manifest.json valide (Application tab)
- [ ] Bouton install visible sur mobile
- [ ] App installable depuis Chrome (Android)
- [ ] Mode standalone fonctionne
- [ ] Offline.html s'affiche hors ligne

---

## 📱 Comportements Attendus

### Sur Mobile (Chrome)

1. Utilisateur visite l'app
2. Après quelques secondes → Bouton "Installer ALODO" apparaît
3. Clic → Installation
4. App lancée en mode standalone (sans barre de navigation)
5. Icône sur l'écran d'accueil

### Sur Desktop (Edge/Chrome)

1. Adresse bar → Icône d'installation
2. Clic → Installation
3. App lancée dans sa propre fenêtre
4. Icône sur le bureau

### Offline

1. Utilisateur sans connexion → offline.html
2. Détection de reconnexion → Redirection auto

---

## 🚀 Fonctionnalités Implémentées

✅ **Enregistrement Service Worker** - Automatique au chargement de l'app
✅ **Manifest PWA** - Généré par Next.js depuis app/manifest.ts
✅ **Métadonnées PWA** - Dans layout.tsx pour iOS/Android
✅ **Cache simple** - Base pour offline (extensible)
✅ **Bouton installation** - Responsive et stylisé
✅ **Page offline** - Fallback hors ligne avec reconnexion
✅ **Support Apple** - Web app capable + splash screen

---

## 🔮 Prochaines Étapes Optionnelles

- [ ] Sync en arrière-plan (Background Sync API)
- [ ] Notifications push (Push API)
- [ ] Periodic background sync
- [ ] Améliorer la stratégie de cache (Stale-While-Revalidate)
- [ ] Update notifications

---

## 📚 Documentation Référence

- Next.js PWA: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
- Web.dev PWA: https://web.dev/progressive-web-apps/
- Manifest spec: https://www.w3.org/TR/appmanifest/
- Service Worker: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

**Créé**: 29 Mars 2026
**Version**: 1.0
**Statut**: ✅ Production-Ready (après création des icônes)
