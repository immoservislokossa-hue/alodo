import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MONEROO_API_URL = "https://api.moneroo.io/v1";
const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const { payoutId, creditId } = await req.json();

    if (!payoutId) {
      return NextResponse.json(
        { error: "Missing payoutId" },
        { status: 400 }
      );
    }

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

    // Verify payout status with Moneroo
    const verifyResponse = await fetch(
      `${MONEROO_API_URL}/payouts/${payoutId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      return NextResponse.json(
        { error: "Failed to verify payout", details: error },
        { status: 500 }
      );
    }

    const payoutData = await verifyResponse.json();
    const monerooStatus = payoutData.data.status; // success, pending, failed

    // Map Moneroo status to our status
    let creditStatus = "initiated";
    if (monerooStatus === "success") {
      creditStatus = "sent";
    } else if (monerooStatus === "failed") {
      creditStatus = "failed";
    }

    // Update credit record if creditId is provided
    if (creditId) {
      const { error: updateError } = await supabase
        .from("institution_credits")
        .update({
          status: creditStatus,
          sent_at:
            creditStatus === "sent" ? new Date().toISOString() : undefined,
        })
        .eq("id", creditId);

      if (updateError) {
        console.error("Failed to update credit:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        payoutId,
        monerooStatus,
        creditStatus,
        monerooData: payoutData.data,
      },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
