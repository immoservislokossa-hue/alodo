import { NextRequest, NextResponse } from "next/server";

// For now, we'll use a simple mock implementation
// In production, you would use fetch to call Google Gemini API directly
// Or use: import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const frenchPrompt = `Tu es un expert en finance pour l'économie informelle. Crée un résumé d'une opportunité en EXACTEMENT 3 paragraphes, langage simple, 45 secondes.

Offre: ${description}

Réponds avec UNIQUEMENT les 3 paragraphes en français.`;

    const yorubaPrompt = `You are an expert in informal economy finance. Create EXACTLY 3 paragraph summary, simple language, 45 seconds.

Offer: ${description}

Reply with ONLY 3 paragraphs in Yoruba.`;

    // Call Google Gemini API
    const callGemini = async (text: string) => {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Gemini API error");
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    };

    // Add API key to URL
    const urlWithKey = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const [frenchSummary, yorubaSummary] = await Promise.all([
      fetch(urlWithKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: frenchPrompt }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
        }),
      })
        .then((r) => r.json())
        .then((d) => d.candidates?.[0]?.content?.parts?.[0]?.text || ""),
      fetch(urlWithKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: yorubaPrompt }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
        }),
      })
        .then((r) => r.json())
        .then((d) => d.candidates?.[0]?.content?.parts?.[0]?.text || ""),
    ]);

    if (!frenchSummary || !yorubaSummary) {
      return NextResponse.json(
        { error: "Failed to generate summaries" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summaries: {
        fr: frenchSummary.trim(),
        yor: yorubaSummary.trim(),
      },
    });
  } catch (error) {
    console.error("Generate summary error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate",
      },
      { status: 500 }
    );
  }
}
