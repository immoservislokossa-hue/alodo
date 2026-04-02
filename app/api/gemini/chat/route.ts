import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// =========================
// RETRY
// =========================
async function generateWithRetry(config: any, retries = 2) {
  try {
    return await ai.models.generateContent(config);
  } catch (error: any) {
    console.error("Erreur generateContent:", error?.status);

    if (retries > 0 && error?.status === 503) {
      console.log("Retry...");
      await new Promise((r) => setTimeout(r, 1000));
      return generateWithRetry(config, retries - 1);
    }
    throw error;
  }
}

// =========================
// CLEAN JSON
// =========================
function safeParse(raw: string) {
  try {
    const clean = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(clean);
  } catch {
    console.log("⚠️ JSON parsing fallback");
    return {
      text: raw,
      steps: "",
      link: null,
    };
  }
}

// =========================
// NORMALIZE STEPS
// =========================
function normalizeSteps(steps: any): string {
  if (!steps) return "";

  if (typeof steps === "string") return steps;

  if (Array.isArray(steps)) {
    return steps
      .map((step, index) => {
        if (typeof step === "string") return `${index + 1}. ${step}`;

        let text = `${step.step_number || index + 1}. ${step.description || ""}`;

        if (step.details && Array.isArray(step.details)) {
          text +=
            "\n" +
            step.details.map((d: string) => `- ${d}`).join("\n");
        }

        return text;
      })
      .join("\n");
  }

  return "";
}

export async function POST(req: Request) {
  console.log("===== NEW REQUEST =====");

  try {
    const {
      message,
      imageBase64,
      imageMimeType,
      audioBase64,
      audioMimeType,
    } = await req.json();

    console.log("Inputs:", {
      text: !!message,
      image: !!imageBase64,
      audio: !!audioBase64,
    });

    let finalUserText = message || "";

    // =========================
    // 1. AUDIO → TEXTE
    // =========================
    if (audioBase64 && audioMimeType) {
      console.log("🎤 Transcribing audio...");

      try {
        const audioRes = await generateWithRetry({
          model: "gemini-2.5-flash",
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    data: audioBase64,
                    mimeType: audioMimeType,
                  },
                },
                {
                  text: "Transcris ce message vocal en français simple.",
                },
              ],
            },
          ],
        });

        finalUserText =
          audioRes.candidates?.[0]?.content?.parts?.[0]?.text ||
          finalUserText;

        console.log("✅ Transcript:", finalUserText);
      } catch {
        console.log("❌ Audio transcription failed");
      }
    }

    // =========================
    // 2. BUILD INPUT
    // =========================
    const parts: any[] = [];

    if (finalUserText) parts.push({ text: finalUserText });

    if (imageBase64 && imageMimeType) {
      console.log("🖼️ Image detected");
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });
    }

    // =========================
    // 3. IA PRINCIPALE
    // =========================
    console.log("🧠 Generating response...");

    let parsed = {
      text: "",
      steps: "",
      link: null,
    };

    try {
      const response = await generateWithRetry({
        model: "gemini-2.5-flash",
        contents: [{ parts }],
        config: {
          systemInstruction: `
Tu es un assistant administratif du Bénin.

Règles:
- français simple
- réponse courte
- pas de **
- utile et direct

Réponds UNIQUEMENT en JSON valide sans markdown:
{
"text": "",
"steps": "",
"link": null
}
          `,
        },
      });

      const raw =
        response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      console.log("📦 RAW:", raw);

      parsed = safeParse(raw);

      // 🔥 NORMALISATION
      parsed.steps = normalizeSteps(parsed.steps);

      console.log("✅ Parsed text:", parsed.text);
      console.log("📋 Steps:", parsed.steps);
    } catch {
      console.log("❌ AI generation failed");

      return Response.json({
        text:
          "Oups, je réfléchis encore pour te donner une réponse fiable.",
        steps: "",
        link: null,
        audio: null,
      });
    }

    // =========================
    // 4. AUDIO
    // =========================
    let audio = null;

    try {
      const finalText = `${parsed.text} ${parsed.steps}`.trim();

      console.log("🔊 Text for audio:", finalText);

      if (finalText) {
        console.log("🎧 Generating audio...");

        const ttsRes = await generateWithRetry({
          model: "gemini-2.5-flash-preview-tts",
          contents: `Explique clairement en moins de 40 secondes: ${finalText}`,
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Kore",
                },
              },
            },
          },
        });

        audio =
          ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

        console.log(audio ? "✅ Audio OK" : "⚠️ Audio vide");
      }
    } catch (err) {
      console.log("❌ Audio failed", err);
      audio = null;
    }

    // =========================
    // 5. RESPONSE
    // =========================
    return Response.json({
      text:
        parsed.text ||
        "Je cherche encore une réponse fiable. Réessaie.",
      steps: parsed.steps || "",
      link: parsed.link || null,
      audio,
    });
  } catch (error) {
    console.error("💥 Backend error:", error);

    return Response.json({
      text:
        "Oups, je consulte encore les informations officielles.",
      steps: "",
      link: null,
      audio: null,
    });
  }
}