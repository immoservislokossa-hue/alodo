// app/api/ussd/opportunities/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('profileId')
  
  if (!profileId) {
    return NextResponse.json({ success: false, error: "Profile ID requis" })
  }
  
  const supabase = createRouteHandlerClient({ cookies })
  
  // Recuperer les matches pour ce profil
  const { data: matches, error: matchesError } = await supabase
    .from('post_institution_matches')
    .select(`
      score,
      can_apply,
      matching_reasons,
      post_institution:post_institutions (
        id,
        titre,
        description,
        montant_min_fcfa,
        montant_max_fcfa,
        date_limite,
        statut,
        institution_profile_id
      )
    `)
    .eq('profile_id', profileId)
    .eq('post_institution.statut', 'publie')
    .gte('post_institution.date_limite', new Date().toISOString())
    .order('score', { ascending: false })
  
  if (matchesError) {
    return NextResponse.json({ success: false, error: matchesError.message })
  }
  
  // Recuperer les noms des institutions
  const institutionIds = matches
    .filter(m => m.post_institution?.institution_profile_id)
    .map(m => m.post_institution.institution_profile_id)
  
  let institutionsMap = new Map()
  
  if (institutionIds.length > 0) {
    const { data: institutions } = await supabase
      .from('profiles')
      .select('id, phone')
      .in('id', institutionIds)
    
    institutions?.forEach(inst => {
      institutionsMap.set(inst.id, inst.phone || "Entreprise")
    })
  }
  
  const opportunities = matches
    .filter(match => match.post_institution)
    .map(match => ({
      id: match.post_institution.id,
      titre: match.post_institution.titre,
      description: match.post_institution.description,
      montant_min_fcfa: match.post_institution.montant_min_fcfa,
      montant_max_fcfa: match.post_institution.montant_max_fcfa,
      date_limite: match.post_institution.date_limite,
      institution_nom: institutionsMap.get(match.post_institution.institution_profile_id) || "Entreprise",
      score_match: match.score,
      can_apply: match.can_apply
    }))
  
  return NextResponse.json({ 
    success: true, 
    opportunities,
    total: opportunities.length 
  })
}