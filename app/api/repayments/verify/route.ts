import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MONEROO_API_URL = "https://api.moneroo.io/v1";
const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY;

type VerifyRepaymentRequest = {
  paymentId: string;
  repaymentId: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: VerifyRepaymentRequest = await req.json();
    const { paymentId, repaymentId } = body;

    if (!paymentId || !repaymentId) {
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

    // Verify Moneroo payment status
    const verifyResponse = await fetch(
      `${MONEROO_API_URL}/payments/${paymentId}/verify`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      console.error("Moneroo error:", error);
      return NextResponse.json(
        { error: "Failed to verify payment", details: error },
        { status: 500 }
      );
    }

    const monerooData = await verifyResponse.json();
    const monerooStatus = monerooData.data?.status || "unknown";

    // Map Moneroo status to our internal status
    const statusMap: Record<string, string> = {
      success: "success",
      pending: "pending",
      failed: "failed",
    };

    const internalStatus = statusMap[monerooStatus] || "failed";

    // Update repayment record
    const { data: repayment, error: updateError } = await supabase
      .from("credit_repayments")
      .update({
        status: internalStatus,
        ...(internalStatus === "success" && {
          completed_at: new Date().toISOString(),
        }),
      })
      .eq("id", repaymentId)
      .select()
      .single();

    if (updateError) {
      console.error("Database error:", updateError);
      return NextResponse.json(
        { error: "Failed to update repayment status" },
        { status: 500 }
      );
    }

    // If payment successful, check if credit is fully repaid
    if (internalStatus === "success") {
      const credit = await supabase
        .from("credit_repayments")
        .select("credit_id")
        .eq("id", repaymentId)
        .single();

      if (credit.data) {
        const { data: creditRecord } = await supabase
          .from("institution_credits")
          .select("amount")
          .eq("id", credit.data.credit_id)
          .single();

        if (creditRecord) {
          const { data: allRepayments } = await supabase
            .from("credit_repayments")
            .select("amount")
            .eq("credit_id", credit.data.credit_id)
            .eq("status", "success");

          const totalRepaid =
            allRepayments?.reduce((sum, r) => sum + r.amount, 0) || 0;

          // If fully repaid, update credit status
          if (totalRepaid >= creditRecord.amount) {
            await supabase
              .from("institution_credits")
              .update({ status: "repaid", repaid_at: new Date().toISOString() })
              .eq("id", credit.data.credit_id);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Repayment status verified and updated",
      data: {
        paymentId,
        repaymentId,
        monerooStatus,
        internalStatus,
        repayment,
        monerooData: monerooData.data,
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
