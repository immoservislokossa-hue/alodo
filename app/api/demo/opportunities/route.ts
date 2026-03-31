import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

interface Opportunity {
  id: string;
  titre: string;
  institution_nom: string;
  montant_min_fcfa?: number;
  montant_max_fcfa?: number;
  date_limite?: string;
  description: string;
  score_match?: number;
  can_apply?: boolean;
  [key: string]: unknown;
}

interface Match {
  id: string;
  post_id: string;
  score: number;
  can_apply: boolean;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "Profile ID required" },
        { status: 400 }
      );
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Récupérer les opportunités basées sur le type de profil
    const { data: opportunities, error: oppError } = await supabase
      .from("posts_institution")
      .select("*")
      .gt("date_limite", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (oppError) {
      console.error("Opportunities error:", oppError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch opportunities" },
        { status: 500 }
      );
    }

    // Récupérer les scores de matching pour ce profil
    const { data: matches, error: matchError } = await supabase
      .from("scoring_matches")
      .select("*")
      .eq("profile_id", profileId);

    if (matchError) {
      console.error("Match error:", matchError);
    }

    // Enrichir les opportunités avec les scores de matching
    const enrichedOpportunities = (opportunities || []).map((opp: Opportunity) => {
      const match = (matches as Match[] | null)?.find((m: Match) => m.post_id === opp.id);
      return {
        ...opp,
        score_match: match?.score || 0,
        can_apply: match ? match.can_apply : true,
      };
    });

    return NextResponse.json({
      success: true,
      profile,
      opportunities: enrichedOpportunities,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
