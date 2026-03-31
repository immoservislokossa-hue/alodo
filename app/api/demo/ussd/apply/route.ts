// app/api/ussd/apply/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { profileId, opportunityId } = await request.json()
  
  if (!profileId || !opportunityId) {
    return NextResponse.json({ success: false, error: "Informations manquantes" })
  }
  
  const supabase = createRouteHandlerClient({ cookies })
  
  // Verifier que le match existe et que le candidat peut postuler
  const { data: match, error: matchError } = await supabase
    .from('post_institution_matches')
    .select('can_apply, post_institution:post_institutions(*)')
    .eq('profile_id', profileId)
    .eq('post_institution_id', opportunityId)
    .single()
  
  if (matchError || !match) {
    return NextResponse.json({ success: false, error: "Opportunite non disponible" })
  }
  
  if (!match.can_apply) {
    return NextResponse.json({ success: false, error: "Vous ne pouvez pas postuler a cette opportunite" })
  }
  
  // Verifier que l'opportunite est encore valide
  const post = match.post_institution
  if (post.statut !== 'publie') {
    return NextResponse.json({ success: false, error: "Opportunite non disponible" })
  }
  
  if (post.date_limite && new Date(post.date_limite) < new Date()) {
    return NextResponse.json({ success: false, error: "Date limite depassee" })
  }
  
  // Creer la candidature
  const reference = `ALD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
  
  const { data: application, error: insertError } = await supabase
    .from('candidatures')
    .insert({
      profile_id: profileId,
      post_institution_id: opportunityId,
      reference: reference,
      status: 'pending',
      applied_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (insertError) {
    console.error("Erreur insertion candidature:", insertError)
    return NextResponse.json({ success: false, error: "Erreur lors de l'envoi" })
  }
  
  // Marquer le match comme vu
  await supabase
    .from('post_institution_matches')
    .update({ 
      seen_at: new Date().toISOString(),
      notified_in_app: true 
    })
    .eq('profile_id', profileId)
    .eq('post_institution_id', opportunityId)
  
  return NextResponse.json({ 
    success: true, 
    application,
    reference: reference
  })
}