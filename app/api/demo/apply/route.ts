import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, opportunityId } = body;

    if (!profileId || !opportunityId) {
      return NextResponse.json(
        { success: false, error: "Profile ID and Opportunity ID required" },
        { status: 400 }
      );
    }

    // Vérifier que le profil existe
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Vérifier que l'opportunité existe
    const { data: opportunity, error: oppError } = await supabase
      .from("posts_institution")
      .select("id, titre, institution_nom")
      .eq("id", opportunityId)
      .maybeSingle();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { success: false, error: "Opportunity not found" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur n'a pas déjà postulé
    const { data: existingApplication } = await supabase
      .from("applications")
      .select("id")
      .eq("profile_id", profileId)
      .eq("post_id", opportunityId)
      .maybeSingle();

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: "You have already applied to this opportunity" },
        { status: 400 }
      );
    }

    // Créer la candidature
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert([
        {
          profile_id: profileId,
          post_id: opportunityId,
          status: "pending",
          submitted_at: new Date().toISOString(),
          source: "ussd_demo",
        },
      ])
      .select();

    if (appError) {
      console.error("Application error:", appError);
      return NextResponse.json(
        { success: false, error: "Failed to submit application" },
        { status: 500 }
      );
    }

    // Log l'action USSD
    await supabase.from("ussd_logs").insert([
      {
        action: "application_submitted",
        profile_id: profileId,
        post_id: opportunityId,
        timestamp: new Date().toISOString(),
        metadata: {
          source: "ussd_demo",
          opportunity_title: opportunity.titre,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      application: application?.[0],
      message: `Application submitted for ${opportunity.titre}`,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
