'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  BarChart2,
  ShieldCheck,
  Tag,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowUpRight,
  Flame,
  Globe,
  Download,
  MessageCircle,
  DollarSign,
  Building2,
  Clock,
  Award,
  Sparkles,
  Eye,
  BookOpen,
  Lightbulb,
  ArrowLeft
} from 'lucide-react'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Tendance = 'hausse' | 'stable' | 'baisse'
type Impact = 'positif' | 'neutre' | 'negatif'
type NiveauConcurrence = 'faible' | 'moyen' | 'eleve'

interface PrixMarche {
  produit: string
  prix_min: number
  prix_max: number
  unite: string
  tendance: Tendance
  variation_pct: number
}

interface Concurrence {
  niveau: NiveauConcurrence
  nb_acteurs: string
  parts_marche: { nom: string; part: number }[]
  points_cles: string[]
}

interface TendanceSectorielle {
  titre: string
  description: string
  impact: Impact
  horizon: string
  score_opportunite: number
}

interface RegleBCEAO {
  titre: string
  description: string
  source: string
  date_maj: string
  statut: 'obligatoire' | 'recommande' | 'info'
}

interface SecteurData {
  secteur: string
  sous_secteur: string
  commune: string
  prix_marche: PrixMarche[]
  concurrence: Concurrence
  tendances: TendanceSectorielle[]
  reglementation: RegleBCEAO[]
}

type Langue = 'fr' | 'fon' | 'yor'

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────

const MOCK_DATA: Record<string, SecteurData> = {
  commerce_alimentaire: {
    secteur: 'Commerce',
    sous_secteur: 'Alimentaire',
    commune: 'Cotonou',
    prix_marche: [
      { produit: 'Riz local (sac 50kg)', prix_min: 22000, prix_max: 26000, unite: 'sac', tendance: 'hausse', variation_pct: 8 },
      { produit: 'Huile de palme (bidon 5L)', prix_min: 4500, prix_max: 5200, unite: 'bidon', tendance: 'stable', variation_pct: 1 },
      { produit: 'Farine de blé (sac 50kg)', prix_min: 17000, prix_max: 19500, unite: 'sac', tendance: 'hausse', variation_pct: 12 },
      { produit: 'Tomate (cageot)', prix_min: 8000, prix_max: 14000, unite: 'cageot', tendance: 'baisse', variation_pct: -15 },
      { produit: 'Sucre (sac 50kg)', prix_min: 28000, prix_max: 31000, unite: 'sac', tendance: 'stable', variation_pct: 2 },
    ],
    concurrence: {
      niveau: 'eleve',
      nb_acteurs: '2 400 – 3 100',
      parts_marche: [
        { nom: 'Grandes surfaces (Erevan, etc.)', part: 18 },
        { nom: 'Boutiques de quartier', part: 47 },
        { nom: 'Vendeurs ambulants', part: 22 },
        { nom: 'Marchés formels', part: 13 },
      ],
      points_cles: [
        'Forte concentration autour du marché Dantokpa et Ganhi',
        'Livraison à domicile en essor (+34% en 12 mois)',
        'Différenciation par la qualité et le crédit client',
        'Les clients fidèles représentent 60% du CA moyen',
      ],
    },
    tendances: [
      {
        titre: 'Essor de la vente en ligne alimentaire',
        description: 'Les plateformes comme Glovo et les groupes WhatsApp de commandes collectives captent une clientèle urbaine croissante. Les épiceries qui proposent la prise de commande par téléphone progressent de 28% vs celles qui n\'y sont pas.',
        impact: 'positif',
        horizon: '6 – 18 mois',
        score_opportunite: 82,
      },
      {
        titre: 'Tension sur les prix des céréales importées',
        description: 'La hausse des cours mondiaux du blé et du riz importé impacte les marges. Les commerçants qui s\'approvisionnent localement (riz de l\'Alibori) maintiennent mieux leurs prix.',
        impact: 'negatif',
        horizon: '3 – 6 mois',
        score_opportunite: 35,
      },
      {
        titre: 'Croissance de la classe moyenne à Cotonou',
        description: 'La demande pour des produits alimentaires de meilleure qualité (emballage, hygiène) augmente. Opportunité pour se positionner sur le segment "qualité" avec un différentiel de prix de 10-15%.',
        impact: 'positif',
        horizon: '12 – 36 mois',
        score_opportunite: 74,
      },
    ],
    reglementation: [
      {
        titre: 'Licence de commerce alimentaire',
        description: 'Toute activité de vente de denrées alimentaires requiert une inscription au RCCM et un IFU actif. Les contrôles de l\'ANPC se sont intensifiés en 2025-2026.',
        source: 'ANPC / Ministère du Commerce',
        date_maj: 'Janvier 2026',
        statut: 'obligatoire',
      },
      {
        titre: 'Normes d\'hygiène CEDEAO',
        description: 'Les produits alimentaires vendus doivent respecter les normes CEDEAO sur la conservation et l\'étiquetage. Amendes de 50 000 à 500 000 FCFA en cas de non-conformité.',
        source: 'CEDEAO / Codex Alimentarius',
        date_maj: 'Mars 2026',
        statut: 'obligatoire',
      },
      {
        titre: 'Crédit fournisseur : nouvelle directive BCEAO',
        description: 'La BCEAO encourage les IMF à proposer des produits de crédit de stock court terme (30-90 jours) aux commerçants formalisés. Taux plafond : 12% annuel pour les IMF agréées.',
        source: 'BCEAO – Instruction N°008-2025',
        date_maj: 'Octobre 2025',
        statut: 'info',
      },
    ],
  },
  services_couture: {
    secteur: 'Services',
    sous_secteur: 'Couture & Habillement',
    commune: 'Porto-Novo',
    prix_marche: [
      { produit: 'Confection boubou homme', prix_min: 8000, prix_max: 18000, unite: 'pièce', tendance: 'stable', variation_pct: 3 },
      { produit: 'Robe de soirée wax', prix_min: 15000, prix_max: 45000, unite: 'pièce', tendance: 'hausse', variation_pct: 9 },
      { produit: 'Uniforme scolaire (ensemble)', prix_min: 6000, prix_max: 10000, unite: 'ensemble', tendance: 'stable', variation_pct: 0 },
      { produit: 'Retouche pantalon', prix_min: 1000, prix_max: 2500, unite: 'retouche', tendance: 'hausse', variation_pct: 15 },
      { produit: 'Wax 6 yards (tissu)', prix_min: 7500, prix_max: 14000, unite: 'pièce', tendance: 'hausse', variation_pct: 11 },
    ],
    concurrence: {
      niveau: 'moyen',
      nb_acteurs: '800 – 1 200',
      parts_marche: [
        { nom: 'Ateliers de quartier', part: 58 },
        { nom: 'Couturières à domicile', part: 26 },
        { nom: 'Boutiques prêt-à-porter', part: 12 },
        { nom: 'Import Chine/Turquie', part: 4 },
      ],
      points_cles: [
        'La demande de tenues personnalisées résiste bien au prêt-à-porter',
        'Réseaux sociaux (Instagram/TikTok) = principale source de nouveaux clients',
        'Délai de livraison : facteur clé de fidélisation',
        'Forte saisonnalité : fêtes, rentrée scolaire, mariages',
      ],
    },
    tendances: [
      {
        titre: 'Mode afro-fusion en forte demande',
        description: 'Le mariage des tissus africains (wax, kente, bogolan) avec des coupes modernes séduit la jeunesse urbaine. Les artisans qui maîtrisent ce style facturent 30-50% plus cher.',
        impact: 'positif',
        horizon: '12 – 24 mois',
        score_opportunite: 88,
      },
      {
        titre: 'Hausse du prix du wax et du fil',
        description: 'Les matières premières ont augmenté de 10-15% en 2025. Répercuter sur les prix ou absorber la marge ? Les artisans qui travaillent avec des fournisseurs locaux sont moins exposés.',
        impact: 'negatif',
        horizon: '3 – 9 mois',
        score_opportunite: 28,
      },
      {
        titre: 'Commandes groupées via WhatsApp Business',
        description: 'Plusieurs couturières à Porto-Novo forment des groupements informels pour gérer des commandes de tenues identiques (uniformes associatifs, cérémonies). Le CA moyen progresse de 40%.',
        impact: 'positif',
        horizon: '0 – 6 mois',
        score_opportunite: 79,
      },
    ],
    reglementation: [
      {
        titre: 'Artisan reconnu : carte professionnelle FENAB',
        description: 'L\'obtention de la carte professionnelle de la FENAB (Fédération Nationale des Artisans du Bénin) permet d\'accéder aux marchés publics et aux crédits artisanaux.',
        source: 'FENAB / Ministère des PME',
        date_maj: 'Février 2026',
        statut: 'recommande',
      },
      {
        titre: 'Cotisations CNSS pour artisans',
        description: 'Les artisans indépendants peuvent s\'affilier volontairement à la CNSS (régime simplifié). Cotisation fixe de 7 500 FCFA/trimestre. Donne accès à la protection maladie et retraite.',
        source: 'CNSS Bénin',
        date_maj: 'Janvier 2026',
        statut: 'recommande',
      },
      {
        titre: 'Fonds d\'appui aux artisans BCEAO/BRS',
        description: 'La Banque Régionale de Solidarité (BRS) propose des micro-crédits équipement pour les artisans formalisés. Montant : 150 000 à 3 000 000 FCFA, taux préférentiel 8%.',
        source: 'BRS / BCEAO',
        date_maj: 'Novembre 2025',
        statut: 'info',
      },
    ],
  },
}

// ─────────────────────────────────────────────
// COMPOSANTS
// ─────────────────────────────────────────────

function TrendBadge({ tendance, variation }: { tendance: Tendance; variation: number }) {
  if (tendance === 'hausse') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
      <TrendingUp size={12} /> +{variation}%
    </span>
  )
  if (tendance === 'baisse') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
      <TrendingDown size={12} /> {variation}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      <Minus size={12} /> Stable
    </span>
  )
}

function ImpactBadge({ impact }: { impact: Impact }) {
  const map = {
    positif: { label: 'Opportunité', cls: 'bg-green-100 text-green-700', Icon: Sparkles },
    negatif: { label: 'Risque', cls: 'bg-red-100 text-red-600', Icon: AlertCircle },
    neutre: { label: 'À surveiller', cls: 'bg-yellow-100 text-yellow-700', Icon: Eye },
  }
  const { label, cls, Icon } = map[impact]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

function NiveauConcurrenceBadge({ niveau }: { niveau: NiveauConcurrence }) {
  const map = {
    faible: { label: 'Faible', cls: 'bg-green-100 text-green-700' },
    moyen: { label: 'Moyen', cls: 'bg-yellow-100 text-yellow-700' },
    eleve: { label: 'Élevé', cls: 'bg-red-100 text-red-600' },
  }
  const { label, cls } = map[niveau]
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

function StatutBadge({ statut }: { statut: RegleBCEAO['statut'] }) {
  if (statut === 'obligatoire') return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Obligatoire</span>
  )
  if (statut === 'recommande') return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Recommandé</span>
  )
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Information</span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#008751' : score >= 40 ? '#FCD116' : '#E8112D'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}/100</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// SECTION PRIX
// ─────────────────────────────────────────────

function SectionPrix({ data }: { data: PrixMarche[] }) {
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{item.produit}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {item.prix_min.toLocaleString('fr-FR')} – {item.prix_max.toLocaleString('fr-FR')} FCFA / {item.unite}
            </p>
          </div>
          <TrendBadge tendance={item.tendance} variation={item.variation_pct} />
        </div>
      ))}
      <p className="text-xs text-gray-400 text-center pt-3">
        Estimations basées sur des relevés de marché régionaux UEMOA – Mars 2026
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// SECTION CONCURRENCE
// ─────────────────────────────────────────────

function SectionConcurrence({ data }: { data: Concurrence }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50">
        <div>
          <p className="text-xs text-gray-500 mb-1">Niveau de concurrence</p>
          <NiveauConcurrenceBadge niveau={data.niveau} />
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Acteurs estimés</p>
          <p className="text-sm font-bold text-gray-700">{data.nb_acteurs}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Répartition du marché</p>
        <div className="space-y-3">
          {data.parts_marche.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{p.nom}</span>
                <span className="font-medium text-gray-700">{p.part}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${p.part}%`, backgroundColor: '#008751', opacity: 0.6 + (i * 0.1) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Points clés</p>
        <div className="space-y-2">
          {data.points_cles.map((pt, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
              <ArrowUpRight size={14} className="text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600">{pt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SECTION TENDANCES
// ─────────────────────────────────────────────

function SectionTendances({ data }: { data: TendanceSectorielle[] }) {
  const [expanded, setExpanded] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {data.map((t, i) => (
        <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3 flex-1">
              <Flame size={16} className={t.impact === 'positif' ? 'text-green-600' : t.impact === 'negatif' ? 'text-red-600' : 'text-yellow-600'} />
              <span className="text-sm font-semibold text-gray-800">{t.titre}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ImpactBadge impact={t.impact} />
              {expanded === i ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>
          </button>
          {expanded === i && (
            <div className="px-4 pb-4 bg-gray-50 space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed pt-2">{t.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Horizon : {t.horizon}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Score d'opportunité</p>
                <ScoreBar score={t.score_opportunite} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// SECTION RÉGLEMENTATION
// ─────────────────────────────────────────────

function SectionReglementation({ data }: { data: RegleBCEAO[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {data.map((r, i) => (
        <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3 flex-1">
              <ShieldCheck size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">{r.titre}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatutBadge statut={r.statut} />
              {expanded === i ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>
          </button>
          {expanded === i && (
            <div className="px-4 pb-4 bg-gray-50 space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed pt-2">{r.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-200">
                <span>{r.source}</span>
                <span>Mis à jour : {r.date_maj}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────

const TABS = [
  { id: 'prix', label: 'Prix marché', icon: Tag },
  { id: 'concurrence', label: 'Concurrence', icon: Users },
  { id: 'tendances', label: 'Tendances', icon: BarChart2 },
  { id: 'reglementation', label: 'Réglementation', icon: ShieldCheck },
] as const

type TabId = typeof TABS[number]['id']

const MOCK_PROFIL = {
  prenom: 'Adjoua',
  secteur: 'Commerce',
  sous_secteur: 'Alimentaire',
  commune: 'Cotonou',
  secteur_key: 'commerce_alimentaire',
}

const QUICK_LABELS: Record<Langue, { p1: string; source: string; ussd: string; copied: string }> = {
  fr: {
    p1: 'Réponse au défi P1: donner aux MPME des données sectorielles fiables et actionnables.',
    source: 'Sources: BCEAO, ANPC, CEDEAO, relevés terrain BeniBiz (mise à jour mensuelle).',
    ussd: 'Exporter résumé USSD',
    copied: 'Résumé copié. Collez-le dans USSD/SMS.',
  },
  fon: {
    p1: 'Gbè P1: nyi nonvitcha gbeta to azɔn na MPME lɛ.',
    source: 'Xɔ́nnu: BCEAO, ANPC, CEDEAO, nuxlɛ́lɛ BeniBiz.',
    ussd: 'Wé résumé USSD',
    copied: 'Résumé wé. Na kplɔe ɖo USSD/SMS me.',
  },
  yor: {
    p1: 'Idahun si P1: fi data to daju han awon MPME.',
    source: 'Orisun: BCEAO, ANPC, CEDEAO ati data oko BeniBiz.',
    ussd: 'Ko akopo USSD jade',
    copied: 'A ti ko akopo. Te e sinu USSD/SMS.',
  },
}

function buildUssdDigest(data: SecteurData) {
  const topPrices = data.prix_marche.slice(0, 3).map(p => `${p.produit}: ${p.prix_min}-${p.prix_max} FCFA`).join(', ')
  return `BENINBIZ - ${data.secteur}/${data.sous_secteur} (${data.commune})
Prix: ${topPrices}
Concurrence: ${data.concurrence.niveau}
Tendance: ${data.tendances[0].titre}
Reglementation: ${data.reglementation[0].titre}
Plus d'infos: *789#`
}

export default function AnalyseSecteurPage() {
  const [activeTab, setActiveTab] = useState<TabId>('prix')
  const [langue, setLangue] = useState<Langue>('fr')
  const [toast, setToast] = useState<string | null>(null)

  const data = MOCK_DATA[MOCK_PROFIL.secteur_key]
  const currentLabels = QUICK_LABELS[langue]

  const copyUssd = () => {
    const ussd = buildUssdDigest(data)
    navigator.clipboard.writeText(ussd)
    setToast(currentLabels.copied)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 h-1 flex z-50">
        <div className="flex-1 bg-[#008751]" />
        <div className="flex-1 bg-[#FCD116]" />
        <div className="flex-1 bg-[#E8112D]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/prestataire" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={16} /> Retour
            </Link>
            <select
              value={langue}
              onChange={(e) => setLangue(e.target.value as Langue)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="fr">Français</option>
              <option value="fon">Fon</option>
              <option value="yor">Yoruba</option>
            </select>
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium mb-3">
              <Sparkles size={12} /> Données mises à jour mensuellement
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Bonjour, <span className="text-[#1a3c6b]">{MOCK_PROFIL.prenom}</span>
            </h1>
            <p className="text-gray-500">
              Analyse du secteur <strong>{MOCK_PROFIL.secteur} / {MOCK_PROFIL.sous_secteur}</strong> à {MOCK_PROFIL.commune}
            </p>
          </div>

          {/* Message P1 */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <MessageCircle size={18} className="text-gray-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">{currentLabels.p1}</p>
                <p className="text-xs text-gray-500 mt-1">{currentLabels.source}</p>
              </div>
              <button
                onClick={copyUssd}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors shrink-0"
              >
                <Download size={12} /> {currentLabels.ussd}
              </button>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all relative
                  ${isActive ? 'text-[#1a3c6b]' : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                <Icon size={16} />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a3c6b] rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Contenu */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          {activeTab === 'prix' && <SectionPrix data={data.prix_marche} />}
          {activeTab === 'concurrence' && <SectionConcurrence data={data.concurrence} />}
          {activeTab === 'tendances' && <SectionTendances data={data.tendances} />}
          {activeTab === 'reglementation' && <SectionReglementation data={data.reglementation} />}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Données fournies par BCEAO, ANPC, CEDEAO & relevés terrain BeniBiz
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}