import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// =========================
// RETRY UTILITY
// =========================
async function generateWithRetry(config: any, retries = 2) {
  try {
    return await ai.models.generateContent(config);
  } catch (error: any) {
    if (retries > 0 && error?.status === 503) {
      await new Promise((r) => setTimeout(r, 1000));
      return generateWithRetry(config, retries - 1);
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const {
      message,
      imageBase64,
      imageMimeType,
      audioBase64,
      audioMimeType,
    } = await req.json();

    let finalUserText = message || "";

    // =========================
    // 1. AUDIO → TEXTE
    // =========================
    if (audioBase64 && audioMimeType) {
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
      } catch {
        // fallback silencieux → on continue sans crash
      }
    }

    // =========================
    // 2. BUILD INPUT
    // =========================
    const parts: any[] = [];

    if (finalUserText) {
      parts.push({ text: finalUserText });
    }

    if (imageBase64 && imageMimeType) {
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
    let parsed = {
      text: "",
      steps: "",
      link: null,
    };

    try {
      const response = await generateWithRetry({
        model: "gemini-2.5-flash", // stable pour hackathon
        contents: [{ parts }],
        config: {
          systemInstruction: `
Tu es un assistant administratif du Bénin.

Règles:
- français simple
- réponse courte
- pas de **
- utile et direct
- si image: explique

Retour JSON:
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

      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed.text = raw;
      }
    } catch {
      return Response.json({
        text:
          "Oups, je réfléchis encore pour te donner une réponse fiable. Réessaie dans quelques secondes.",
        steps: "",
        link: null,
        audio: null,
      });
    }

    // =========================
    // 4. AUDIO (OPTIONNEL)
    // =========================
    let audio = null;

    try {
      const finalText = `${parsed.text} ${parsed.steps}`.trim();

      if (finalText.length > 0) {
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
      }
    } catch {
      // audio échoue → on ignore, pas de crash
      audio = null;
    }

    // =========================
    // 5. RESPONSE SAFE
    // =========================
    return Response.json({
      text:
        parsed.text ||
        "Je cherche encore une réponse fiable. Réessaie dans quelques secondes.",
      steps: parsed.steps || "",
      link: parsed.link || null,
      audio, // peut être null → frontend gère
    });
  } catch (error) {
    console.error("Erreur backend:", error);

    return Response.json({
      text:
        "Oups, je consulte encore les informations officielles pour mieux te répondre.",
      steps: "",
      link: null,
      audio: null,
    });
  }
}