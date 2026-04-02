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

// ============================================================================
// COULEURS DU BRANDING ALO̱DÓ
// ============================================================================

const colors = {
  white: '#FFFFFF',
  deepBlue: '#1a3c6b',
  deepBlueDark: '#0e2a4a',
  deepBlueLight: '#2c4e7e',
  beninGreen: '#008751',
  beninYellow: '#FCD116',
  beninRed: '#E8112D',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
}

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// MOCK DATA
// ============================================================================

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
        description: 'Les plateformes comme Glovo et les groupes WhatsApp de commandes collectives captent une clientèle urbaine croissante.',
        impact: 'positif',
        horizon: '6 – 18 mois',
        score_opportunite: 82,
      },
      {
        titre: 'Tension sur les prix des céréales importées',
        description: 'La hausse des cours mondiaux du blé et du riz importé impacte les marges.',
        impact: 'negatif',
        horizon: '3 – 6 mois',
        score_opportunite: 35,
      },
      {
        titre: 'Croissance de la classe moyenne à Cotonou',
        description: 'La demande pour des produits alimentaires de meilleure qualité augmente.',
        impact: 'positif',
        horizon: '12 – 36 mois',
        score_opportunite: 74,
      },
    ],
    reglementation: [
      {
        titre: 'Licence de commerce alimentaire',
        description: 'Toute activité de vente de denrées alimentaires requiert une inscription au RCCM et un IFU actif.',
        source: 'ANPC / Ministère du Commerce',
        date_maj: 'Janvier 2026',
        statut: 'obligatoire',
      },
      {
        titre: 'Normes d\'hygiène CEDEAO',
        description: 'Les produits alimentaires vendus doivent respecter les normes CEDEAO sur la conservation et l\'étiquetage.',
        source: 'CEDEAO / Codex Alimentarius',
        date_maj: 'Mars 2026',
        statut: 'obligatoire',
      },
      {
        titre: 'Crédit fournisseur : nouvelle directive BCEAO',
        description: 'La BCEAO encourage les IMF à proposer des produits de crédit de stock court terme aux commerçants formalisés.',
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
        'Réseaux sociaux = principale source de nouveaux clients',
        'Délai de livraison : facteur clé de fidélisation',
        'Forte saisonnalité : fêtes, rentrée scolaire, mariages',
      ],
    },
    tendances: [
      {
        titre: 'Mode afro-fusion en forte demande',
        description: 'Le mariage des tissus africains avec des coupes modernes séduit la jeunesse urbaine.',
        impact: 'positif',
        horizon: '12 – 24 mois',
        score_opportunite: 88,
      },
      {
        titre: 'Hausse du prix du wax et du fil',
        description: 'Les matières premières ont augmenté de 10-15% en 2025.',
        impact: 'negatif',
        horizon: '3 – 9 mois',
        score_opportunite: 28,
      },
      {
        titre: 'Commandes groupées via WhatsApp Business',
        description: 'Plusieurs couturières forment des groupements informels pour gérer des commandes groupées.',
        impact: 'positif',
        horizon: '0 – 6 mois',
        score_opportunite: 79,
      },
    ],
    reglementation: [
      {
        titre: 'Artisan reconnu : carte professionnelle FENAB',
        description: 'L\'obtention de la carte professionnelle permet d\'accéder aux marchés publics et aux crédits artisanaux.',
        source: 'FENAB / Ministère des PME',
        date_maj: 'Février 2026',
        statut: 'recommande',
      },
      {
        titre: 'Cotisations CNSS pour artisans',
        description: 'Les artisans indépendants peuvent s\'affilier volontairement à la CNSS.',
        source: 'CNSS Bénin',
        date_maj: 'Janvier 2026',
        statut: 'recommande',
      },
      {
        titre: 'Fonds d\'appui aux artisans BCEAO/BRS',
        description: 'La Banque Régionale de Solidarité propose des micro-crédits équipement pour les artisans formalisés.',
        source: 'BRS / BCEAO',
        date_maj: 'Novembre 2025',
        statut: 'info',
      },
    ],
  },
}

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

// ============================================================================
// COMPOSANTS STYLISÉS
// ============================================================================

function TrendBadge({ tendance, variation }: { tendance: Tendance; variation: number }) {
  if (tendance === 'hausse') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '20px',
        background: `${colors.beninRed}10`,
        color: colors.beninRed,
      }}>
        <TrendingUp size={12} /> +{variation}%
      </span>
    )
  }
  if (tendance === 'baisse') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '20px',
        background: `${colors.beninGreen}10`,
        color: colors.beninGreen,
      }}>
        <TrendingDown size={12} /> {variation}%
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: '20px',
      background: colors.gray100,
      color: colors.gray500,
    }}>
      <Minus size={12} /> Stable
    </span>
  )
}

function ImpactBadge({ impact }: { impact: Impact }) {
  const map = {
    positif: { label: 'Opportunité', color: colors.beninGreen, bg: `${colors.beninGreen}10`, Icon: Sparkles },
    negatif: { label: 'Risque', color: colors.beninRed, bg: `${colors.beninRed}10`, Icon: AlertCircle },
    neutre: { label: 'À surveiller', color: colors.beninYellow, bg: `${colors.beninYellow}10`, Icon: Eye },
  }
  const { label, color, bg, Icon } = map[impact]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: '20px',
      background: bg,
      color: color,
    }}>
      <Icon size={12} /> {label}
    </span>
  )
}

function NiveauConcurrenceBadge({ niveau }: { niveau: NiveauConcurrence }) {
  const map = {
    faible: { label: 'Faible', color: colors.beninGreen, bg: `${colors.beninGreen}10` },
    moyen: { label: 'Moyen', color: colors.beninYellow, bg: `${colors.beninYellow}10` },
    eleve: { label: 'Élevé', color: colors.beninRed, bg: `${colors.beninRed}10` },
  }
  const { label, color, bg } = map[niveau]
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: '20px',
      background: bg,
      color: color,
    }}>
      {label}
    </span>
  )
}

function StatutBadge({ statut }: { statut: RegleBCEAO['statut'] }) {
  if (statut === 'obligatoire') {
    return (
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '20px',
        background: `${colors.beninRed}10`,
        color: colors.beninRed,
      }}>
        Obligatoire
      </span>
    )
  }
  if (statut === 'recommande') {
    return (
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '20px',
        background: `${colors.deepBlue}10`,
        color: colors.deepBlue,
      }}>
        Recommandé
      </span>
    )
  }
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: '20px',
      background: colors.gray100,
      color: colors.gray500,
    }}>
      Information
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? colors.beninGreen : score >= 40 ? colors.beninYellow : colors.beninRed
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1,
        height: '6px',
        background: colors.gray100,
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          background: color,
          borderRadius: '3px',
          transition: 'width 0.7s ease',
        }} />
      </div>
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        color: color,
      }}>{score}/100</span>
    </div>
  )
}

// ============================================================================
// SECTIONS
// ============================================================================

function SectionPrix({ data }: { data: PrixMarche[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: colors.white,
          borderRadius: '16px',
          border: `1px solid ${colors.gray200}`,
          transition: 'all 0.2s ease',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: colors.gray800 }}>{item.produit}</p>
            <p style={{ fontSize: '11px', color: colors.gray400, marginTop: '2px' }}>
              {item.prix_min.toLocaleString('fr-FR')} – {item.prix_max.toLocaleString('fr-FR')} FCFA / {item.unite}
            </p>
          </div>
          <TrendBadge tendance={item.tendance} variation={item.variation_pct} />
        </div>
      ))}
      <p style={{ fontSize: '10px', color: colors.gray400, textAlign: 'center', paddingTop: '12px' }}>
        Estimations basées sur des relevés de marché régionaux UEMOA – Mars 2026
      </p>
    </div>
  )
}

function SectionConcurrence({ data }: { data: Concurrence }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        padding: '16px',
        background: colors.gray50,
        borderRadius: '16px',
      }}>
        <div>
          <p style={{ fontSize: '11px', color: colors.gray400, marginBottom: '4px' }}>Niveau de concurrence</p>
          <NiveauConcurrenceBadge niveau={data.niveau} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: colors.gray400, marginBottom: '4px' }}>Acteurs estimés</p>
          <p style={{ fontSize: '14px', fontWeight: 700, color: colors.gray700 }}>{data.nb_acteurs}</p>
        </div>
      </div>

      <div>
        <p style={{ fontSize: '11px', fontWeight: 600, color: colors.gray500, textTransform: 'uppercase', marginBottom: '12px' }}>
          Répartition du marché
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.parts_marche.map((p, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: colors.gray600 }}>{p.nom}</span>
                <span style={{ fontWeight: 500, color: colors.gray700 }}>{p.part}%</span>
              </div>
              <div style={{ height: '6px', background: colors.gray100, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${p.part}%`,
                  height: '100%',
                  background: colors.beninGreen,
                  borderRadius: '3px',
                  opacity: 0.6 + (i * 0.1),
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: '11px', fontWeight: 600, color: colors.gray500, textTransform: 'uppercase', marginBottom: '12px' }}>
          Points clés
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.points_cles.map((pt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: colors.gray50, borderRadius: '12px' }}>
              <ArrowUpRight size={14} color={colors.beninGreen} style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: colors.gray600 }}>{pt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionTendances({ data }: { data: TendanceSectorielle[] }) {
  const [expanded, setExpanded] = useState<number | null>(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((t, i) => (
        <div key={i} style={{ borderRadius: '16px', border: `1px solid ${colors.gray200}`, overflow: 'hidden' }}>
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: colors.white,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <Flame size={16} color={t.impact === 'positif' ? colors.beninGreen : t.impact === 'negatif' ? colors.beninRed : colors.beninYellow} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: colors.gray800 }}>{t.titre}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <ImpactBadge impact={t.impact} />
              {expanded === i ? <ChevronUp size={16} color={colors.gray400} /> : <ChevronDown size={16} color={colors.gray400} />}
            </div>
          </button>
          {expanded === i && (
            <div style={{ padding: '16px', background: colors.gray50, borderTop: `1px solid ${colors.gray200}` }}>
              <p style={{ fontSize: '13px', color: colors.gray600, lineHeight: 1.5, marginBottom: '12px' }}>{t.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: colors.gray400, marginBottom: '12px' }}>
                <span>Horizon : {t.horizon}</span>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: colors.gray400, marginBottom: '6px' }}>Score d'opportunité</p>
                <ScoreBar score={t.score_opportunite} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SectionReglementation({ data }: { data: RegleBCEAO[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((r, i) => (
        <div key={i} style={{ borderRadius: '16px', border: `1px solid ${colors.gray200}`, overflow: 'hidden' }}>
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: colors.white,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <ShieldCheck size={16} color={colors.deepBlue} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: colors.gray800 }}>{r.titre}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <StatutBadge statut={r.statut} />
              {expanded === i ? <ChevronUp size={16} color={colors.gray400} /> : <ChevronDown size={16} color={colors.gray400} />}
            </div>
          </button>
          {expanded === i && (
            <div style={{ padding: '16px', background: colors.gray50, borderTop: `1px solid ${colors.gray200}` }}>
              <p style={{ fontSize: '13px', color: colors.gray600, lineHeight: 1.5, marginBottom: '12px' }}>{r.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: colors.gray400, paddingTop: '8px', borderTop: `1px solid ${colors.gray200}` }}>
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

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

const TABS = [
  { id: 'prix', label: 'Prix marché', icon: Tag },
  { id: 'concurrence', label: 'Concurrence', icon: Users },
  { id: 'tendances', label: 'Tendances', icon: BarChart2 },
  { id: 'reglementation', label: 'Réglementation', icon: ShieldCheck },
] as const

type TabId = typeof TABS[number]['id']

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
    <div style={{
      minHeight: '100vh',
      background: colors.white,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Barre tricolore béninoise */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        display: 'flex',
        zIndex: 50,
      }}>
        <div style={{ flex: 1, background: colors.beninGreen }} />
        <div style={{ flex: 1, background: colors.beninYellow }} />
        <div style={{ flex: 1, background: colors.beninRed }} />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <Link href="/prestataire" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: colors.gray500,
              textDecoration: 'none',
            }}>
              <ArrowLeft size={16} /> Retour
            </Link>
            <select
              value={langue}
              onChange={(e) => setLangue(e.target.value as Langue)}
              style={{
                fontSize: '13px',
                border: `1px solid ${colors.gray200}`,
                borderRadius: '12px',
                padding: '6px 12px',
                background: colors.white,
                color: colors.gray600,
                outline: 'none',
              }}
            >
              <option value="fr">Français</option>
              <option value="fon">Fon</option>
              <option value="yor">Yoruba</option>
            </select>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
             
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 36px)',
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              color: colors.deepBlue,
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}>
              Bonjour, <span style={{ color: colors.deepBlue }}>{MOCK_PROFIL.prenom}</span>
            </h1>
            <p style={{ fontSize: '14px', color: colors.gray500 }}>
              Analyse du secteur <strong style={{ color: colors.gray700 }}>{MOCK_PROFIL.secteur} / {MOCK_PROFIL.sous_secteur}</strong> à {MOCK_PROFIL.commune}
            </p>
          </div>

          {/* Message P1 */}
          <div style={{
            background: colors.gray50,
            borderRadius: '20px',
            padding: '16px',
            border: `1px solid ${colors.gray200}`,
          }}>
            
          </div>
        </div>

        {/* Onglets */}
        <div style={{
          display: 'flex',
          gap: '4px',
          borderBottom: `1px solid ${colors.gray200}`,
          marginBottom: '24px',
        }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? colors.deepBlue : colors.gray500,
                  position: 'relative',
                }}
              >
                <Icon size={16} />
                {tab.label}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: colors.deepBlue,
                    borderRadius: '1px',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Contenu */}
        <div style={{
          background: colors.white,
          borderRadius: '24px',
          border: `1px solid ${colors.gray200}`,
          padding: '24px',
        }}>
          {activeTab === 'prix' && <SectionPrix data={data.prix_marche} />}
          {activeTab === 'concurrence' && <SectionConcurrence data={data.concurrence} />}
          {activeTab === 'tendances' && <SectionTendances data={data.tendances} />}
          {activeTab === 'reglementation' && <SectionReglementation data={data.reglementation} />}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: colors.gray400 }}>
            Données fournies par BCEAO, ANPC, CEDEAO & relevés terrain BeniBiz
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: colors.gray800,
          color: colors.white,
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}