import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Description is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured on server" },
        { status: 500 }
      );
    }

    const frenchPrompt = `Tu es un expert en finance pour l'économie informelle. Crée un résumé d'une opportunité de financement en EXACTEMENT 3 paragraphes.

Règles strictes:
- Exactement 3 paragraphes, pas plus, pas moins
- Langage TRÈS simple et clair (niveau primaire)
- Destiné à une narration audio d'environ 45 secondes
- Chaque phrase courte et directe
- Inclure: objectif du financement, conditions principales, avantages clés

Description de l'offre:
${description}

Génère UNIQUEMENT les 3 paragraphes du résumé en français, sans introduction ni conclusion.`;

    const yorubaPrompt = `You are an expert in informal economy finance. Create a summary of a financing opportunity in EXACTLY 3 paragraphs.

Strict rules:
- Exactly 3 paragraphs, no more, no less
- VERY simple and clear language (primary school level)
- Intended for audio narration of approximately 45 seconds
- Each sentence short and direct
- Include: financing objective, main conditions, key advantages

Offer description:
${description}

Generate ONLY the 3 paragraphs of the summary in Yoruba, without introduction or conclusion. Write in Yoruba language.`;

    // Call Gemini API with key in URL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const generateSummary = async (prompt: string): Promise<string> => {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Gemini API error: ${error.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No text generated from Gemini");
      }

      return text.trim();
    };

    // Generate both summaries in parallel
    const [frenchSummary, yorubaSummary] = await Promise.all([
      generateSummary(frenchPrompt),
      generateSummary(yorubaPrompt),
    ]);

    return NextResponse.json({
      success: true,
      summaries: {
        fr: frenchSummary,
        yor: yorubaSummary,
      },
    });
  } catch (error) {
    console.error("Generate summary error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate summaries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
