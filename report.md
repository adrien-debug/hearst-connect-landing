# QA COMPLET — DASHBOARD CONNECT /APP

## 1. Issues trouvées

| Sévérité | Fichier | Problème |
|---|---|---|
| **High** | `portfolio-summary.tsx` | La légende du Donut Chart affiche tous les vaults actifs sans limite. Le critère "4 items max visibles" n'est pas respecté. |
| **High** | `vault-detail-panel.tsx` | Les `NarrativeBlock` utilisent `<Label variant="text">` ce qui supprime la bordure gauche. Le critère "Label avec border-left accent" n'est pas respecté. |
| **Medium** | `vault-detail-panel.tsx` | Le padding des `StatCard` est de 12px (normal) et 8px (tight/limit) au lieu de 16px (normal) et 12px (tight). |
| **Medium** | `cockpit-gauge.tsx` | La typographie des labels utilise `TOKENS.fontSizes.micro` (11px) au lieu de `xs` (12px). |
| **Medium** | `vault-detail-panel.tsx` | Le composant `ActionButton` ne gère pas l'état `disabled` (grisé) demandé. |
| **Low** | `portfolio-summary.tsx` | Les grid lines du Line Chart utilisent `TOKENS.colors.borderSubtle` (8% opacity) au lieu de 6% opacity. |

## 2. Recommandations précises

- **`src/components/connect/portfolio-summary.tsx` (Ligne ~645)** :
  - *Correction suggérée* : Limiter les items de la légende avec `.slice(0, 4)` : `{data.slice(0, 4).map((vault) => (...))}`
- **`src/components/connect/vault-detail-panel.tsx` (Ligne ~872)** :
  - *Correction suggérée* : Supprimer `variant="text"` ou utiliser `variant="bar"` pour le `<Label>` dans `NarrativeBlock`.
- **`src/components/connect/vault-detail-panel.tsx` (Ligne ~582)** :
  - *Correction suggérée* : Modifier le padding de `StatCard` : `normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[3]`.
- **`src/components/connect/cockpit-gauge.tsx` (Ligne ~60)** :
  - *Correction suggérée* : Changer `fontSize: TOKENS.fontSizes.micro` en `fontSize: TOKENS.fontSizes.xs`.
- **`src/components/connect/vault-detail-panel.tsx` (Ligne ~888)** :
  - *Correction suggérée* : Ajouter une prop `disabled?: boolean` à `ActionButton` et appliquer une opacité/couleur grisée si `disabled` est `true`.
- **`src/components/connect/portfolio-summary.tsx` (Ligne ~915)** :
  - *Correction suggérée* : Changer `stroke={TOKENS.colors.borderSubtle}` par `stroke="rgba(255,255,255,0.06)"` pour les grid lines du Line Chart.

## 3. Checklist complétée

### 🔍 SECTION 1: ARCHITECTURE GLOBALE
- ✅ Header fixe 64px avec logo Hearst Connect aligné gauche
- ✅ Wallet address "0x5F...AA57" aligné droite en monospace 12px uppercase
- ✅ Zone principale sans scroll horizontal (overflow-x hidden)
- ✅ DockRadial fixé en bas (24px depuis bottom), centré
- ✅ Pas de débordement de contenu sur viewports < 768px
- ✅ Space toggle fonctionne sur DockRadial
- ✅ Indicateur actif visible (dot + label DASH/AVAIL/SIMU)
- ✅ 3 états : dashboard / available / simulation
- ✅ Hover sur hub bouton = changement couleur accent

### 🔍 SECTION 2: PORTFOLIO SUMMARY (Vue par défaut)
- ✅ 3 gauges alignées : Position Value / Accrued Yield / Performance
- ❌ Typography : Labels 12px micro (Actuellement 11px)
- ✅ Accent vert (#A7FB90) sur "Accrued Yield" valeur
- ✅ Espacement entre gauges : 24px (normal), 16px (tight), 12px (limit)
- ✅ Cercle proportionnel aux données
- ✅ Hover segment = Stroke épaissi +3px, Glow effect, Centre change, Tooltip flottant apparait
- ✅ Tooltip contient : Nom vault complet, Valeur en USD compact, % portfolio, Claimable en vert
- ✅ Click segment = navigation vers vault detail
- ❌ Légende sous donut : 4 items max visibles (Affiche tous les items actuellement)
- ✅ Dot coloré 8px, Nom tronqué, % arrondi, Hover = highlight ligne + segment
- ✅ 30 points de données, Gradient area sous la ligne
- ❌ Grid lines horizontales subtiles (6% opacity) (Actuellement 8%)
- ✅ Labels Y : 3 valeurs compactes, Labels X : "30d ago" / "Today", Variation % affichée
- ✅ Dot final sur la ligne (accent color)
- ✅ Timeline horizontale avec marqueurs, "Next: X days" affiché, Jusqu'à 4 vaults visibles, Marqueurs colorés
- ✅ Header : "Positions (X)" + bouton "Claim All"
- ✅ Cartes compactes : Background black, Border subtle, Border radius 8px, Padding 12px 14px / 10px 12px
- ✅ Contenu carte : Dot couleur 8px, Nom vault, Valeur totale, Progress bar 2px, % progress, Mini yield
- ✅ HOVER TEST : Overlay quick actions apparait (Fond noir 85%, Blur, Boutons, Transition 150ms)
- ✅ Available Vaults Teaser : "Available (X)" + bouton "View All", 2 vaults teaser visibles max

### 🔍 SECTION 3: VAULT DETAIL PANEL
- ✅ Cockpit Header : Même structure, Labels, Status label
- ✅ Compressed Metrics Strip : 4 métriques en ligne, Typography cohérente
- ❌ Stat Cards (4) : Même padding que design system (16px normal, 12px tight) (Actuellement 12px / 8px)
- ✅ Position Card : Position Value en grand, Badge "Target Reached", Timeline, Epoch badge
- ✅ Target Progress : Progress bar 12px, Track noir / fill blanc ou accent, Label, Texte explicatif
- ✅ Month Distribution : Badge "DAY XX", Track avec fill elapsed, 3 métriques en bas
- ✅ Capital Protection Gauge : 32px hauteur, Gradient background, Ligne verticale, Labels
- ✅ Performance History Chart : 6 barres mensuelles, Barre actuelle en accent, Légende en bas
- ❌ Narrative Blocks (2) : Label avec border-left accent (Actuellement sans bordure)
- ❌ Action Buttons : Disabled state grisé (Non géré actuellement)
- ✅ Modals : Backdrop noir 80%, Animation fade-in 200ms, Header, Content scrollable, Footer, Test Escape, Test scroll lock

### 🔍 SECTION 4: SUBSCRIBE PANEL
- ✅ Input amount avec bordure bottom
- ✅ Validation visuelle (rouge si < minDeposit)
- ✅ Projection realtime si amount > 0
- ✅ Checkbox terms
- ✅ Bouton "Deploy capital" disabled si !isReady

### 🔍 SECTION 5: SIMULATION PANEL
- ✅ Sliders BTC Price et Horizon sticky en haut
- ✅ Valeurs affichées à droite des labels
- ✅ Range $40K-$220K pour BTC, Range 3M-36M pour Horizon
- ✅ Scenario Selector : 3 boutons, Background gauge animé, Active state, Typography cohérente
- ✅ Chart Area : Scrollable, 3 lignes, Grid lines subtiles, Métriques tiles en bas

### 🔍 SECTION 6: DESIGN SYSTEM COMPLIANCE
- ✅ Couleurs (TOKENS.colors) respectées
- ✅ Typography respectée
- ❌ Spacing (TOKENS.spacing) : Pas de valeurs hardcodées en px (Quelques exceptions trouvées comme 10px, 14px dans les paddings des cartes compactes)
- ✅ Responsive (3 modes) : normal, tight, limit

### 🔍 SECTION 7: INTERACTIONS & ACCESSIBILITÉ
- ✅ Tous les éléments cliquables ont cursor: pointer
- ✅ Focus visible sur éléments tabulables
- ✅ Aria-labels sur boutons icones
- ✅ Keyboard navigation fonctionnelle
- ✅ Animations smooth

### 🔍 SECTION 8: PERFORMANCES
- ✅ Pas de re-render inutile sur resize
- ✅ useMemo sur calculs lourds (donutData, valueHistory)
- ✅ Pas de fuites mémoire
