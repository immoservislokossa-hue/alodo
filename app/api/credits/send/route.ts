import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MONEROO_API_URL = "https://api.moneroo.io/v1";
const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY;

type SendCreditRequest = {
  userId: string;
  amount: number;
  currency?: string;
  description: string;
  method?: string; // MTN, Orange, etc.
  phoneNumber: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: SendCreditRequest = await req.json();
    const {
      userId,
      amount,
      currency = "XOF",
      description,
      method = "mtn_bj",
      phoneNumber,
    } = body;

    // Validate input
    if (!userId || !amount || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Get current user (institution)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recipient user info
    const { data: recipientProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("id", userId)
      .single();

    if (profileError || !recipientProfile) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Get recipient auth user for email
    const { data: recipientAuthUserData } = await supabase.auth.admin.getUserById(
      recipientProfile.user_id
    );

    if (!recipientAuthUserData?.user) {
      return NextResponse.json(
        { error: "Recipient auth data not found" },
        { status: 404 }
      );
    }

    const recipientAuthUser = recipientAuthUserData.user;

    // Initialize Moneroo payout
    const payoutInitResponse = await fetch(
      `${MONEROO_API_URL}/payouts/initialize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: Math.floor(amount),
          currency,
          description,
          method,
          customer: {
            email: recipientAuthUser.email || "user@alodo.app",
            first_name:
              (recipientAuthUser.user_metadata as any)?.first_name || "Recipient",
            last_name:
              (recipientAuthUser.user_metadata as any)?.last_name || "ALODO",
          },
          metadata: {
            institution_id: currentUser.id,
            user_id: recipientProfile.user_id,
          },
          recipient: {
            msisdn: phoneNumber.replace(/\D/g, ""), // Remove non-digits
          },
        }),
      }
    );

    if (!payoutInitResponse.ok) {
      const error = await payoutInitResponse.json();
      console.error("Moneroo error:", error);
      return NextResponse.json(
        { error: "Failed to initialize payout", details: error },
        { status: 500 }
      );
    }

    const payoutData = await payoutInitResponse.json();
    const payoutId = payoutData.data.id;

    // Create credit record in database
    const { data: credit, error: creditError } = await supabase
      .from("institution_credits")
      .insert({
        institution_id: currentUser.id,
        user_id: recipientProfile.user_id,
        amount: Math.floor(amount),
        currency,
        description,
        status: "initiated",
        moneroo_payout_id: payoutId,
      })
      .select()
      .single();

    if (creditError) {
      console.error("Database error:", creditError);
      return NextResponse.json(
        { error: "Failed to create credit record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Credit sent successfully",
      data: {
        creditId: credit.id,
        payoutId,
        amount,
        currency,
        status: "initiated",
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
