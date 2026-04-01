import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    // Get current user
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get institution profile for current user
    const { data: institutionProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", currentUser.id)
      .single();

    if (!institutionProfile) {
      return NextResponse.json(
        { error: "Institution profile not found" },
        { status: 404 }
      );
    }

    // Get status filter from query params
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    // Query credits sent by current institution
    let query = supabase
      .from("institution_credits")
      .select(
        `
        id,
        user_id,
        amount,
        currency,
        description,
        status,
        moneroo_payout_id,
        created_at,
        sent_at,
        repaid_at,
        profiles!institution_credits_user_id(
          id,
          full_name,
          archetype,
          phone
        )
      `
      )
      .eq("institution_id", institutionProfile.id)
      .order("created_at", { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data: credits, error: creditsError } = await query;

    if (creditsError) {
      console.error("Database error:", creditsError);
      return NextResponse.json(
        { error: "Failed to fetch credits" },
        { status: 500 }
      );
    }

    // Get repayment details for each credit
    const creditsWithRepayments = await Promise.all(
      credits.map(async (credit: any) => {
        const { data: repayments } = await supabase
          .from("credit_repayments")
          .select("id, amount, status, created_at, completed_at")
          .eq("credit_id", credit.id)
          .order("created_at", { ascending: false });

        const totalRepaid =
          repayments?.reduce(
            (sum, r) =>
              sum + (r.status === "success" ? r.amount : 0),
            0
          ) || 0;

        return {
          ...credit,
          repayments: repayments || [],
          totalRepaid,
          remainingBalance: credit.amount - totalRepaid,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: creditsWithRepayments,
      count: creditsWithRepayments.length,
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
