import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MONEROO_API_URL = "https://api.moneroo.io/v1";
const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY;

type RepaymentRequest = {
  creditId: string;
  amount: number;
  method?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: RepaymentRequest = await req.json();
    const { creditId, amount, method = "mtn_bj" } = body;

    if (!creditId || !amount) {
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

    // Get current user
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get credit record
    const { data: credit, error: creditError } = await supabase
      .from("institution_credits")
      .select("*, profiles!institution_credits_institution_id(user_id)")
      .eq("id", creditId)
      .single();

    if (creditError || !credit) {
      return NextResponse.json(
        { error: "Credit not found" },
        { status: 404 }
      );
    }

    // Verify user owns this credit
    if (credit.user_id !== currentUser.id) {
      return NextResponse.json(
        { error: "Unauthorized: not your credit" },
        { status: 403 }
      );
    }

    // Verify amount doesn't exceed credit
    const { data: totalRepaid } = await supabase
      .from("credit_repayments")
      .select("amount")
      .eq("credit_id", creditId)
      .eq("status", "success");

    const amountRepaid =
      totalRepaid?.reduce((sum, r) => sum + r.amount, 0) || 0;
    if (amountRepaid + amount > credit.amount) {
      return NextResponse.json(
        { error: "Repayment exceeds credit amount" },
        { status: 400 }
      );
    }

    // Get institution user info
    const institutionProfile = credit.profiles;
    const { data: institutionAuthUser } =
      await supabase.auth.admin.getUserById(institutionProfile.user_id);

    if (!institutionAuthUser) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    // Initialize Moneroo payment (user sends money back to institution)
    const paymentInitResponse = await fetch(
      `${MONEROO_API_URL}/payments/initialize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: Math.floor(amount),
          currency: credit.currency || "XOF",
          description: `Remboursement: ${credit.description}`,
          customer: {
            email: currentUser.email || "user@alodo.app",
            first_name: currentUser.user_metadata?.first_name || "User",
            last_name: currentUser.user_metadata?.last_name || "ALODO",
          },
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/wallet?repayment=complete`,
          metadata: {
            credit_id: creditId,
            institution_id: credit.institution_id,
          },
        }),
      }
    );

    if (!paymentInitResponse.ok) {
      const error = await paymentInitResponse.json();
      console.error("Moneroo error:", error);
      return NextResponse.json(
        { error: "Failed to initialize payment", details: error },
        { status: 500 }
      );
    }

    const paymentData = await paymentInitResponse.json();
    const paymentId = paymentData.data.id;
    const checkoutUrl = paymentData.data.checkout_url;

    // Create repayment record
    const { data: repayment, error: repaymentError } = await supabase
      .from("credit_repayments")
      .insert({
        credit_id: creditId,
        amount: Math.floor(amount),
        currency: credit.currency || "XOF",
        description: `Remboursement de ${credit.description}`,
        status: "initiated",
        moneroo_payment_id: paymentId,
      })
      .select()
      .single();

    if (repaymentError) {
      console.error("Database error:", repaymentError);
      return NextResponse.json(
        { error: "Failed to create repayment record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Repayment initiated successfully",
      data: {
        repaymentId: repayment.id,
        paymentId,
        checkoutUrl,
        amount,
        currency: credit.currency || "XOF",
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
