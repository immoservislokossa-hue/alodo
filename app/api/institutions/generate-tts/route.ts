import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, language } = await req.json();

    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_CLOUD_TTS_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!language || !["fr", "yor"].includes(language)) {
      return NextResponse.json(
        { error: "Language must be 'fr' or 'yor'" },
        { status: 400 }
      );
    }

    // Mapping language → Google Cloud voice settings
    const voiceConfig = {
      fr: {
        languageCode: "fr-FR",
        name: "fr-FR-Standard-C", // Female voice
        ssmlGender: "FEMALE",
      },
      yor: {
        languageCode: "yo-NG", // Yoruba Nigeria
        name: "yo-NG-Wave-A", // Fallback to generic if not available
        ssmlGender: "FEMALE",
      },
    };

    const config = voiceConfig[language as keyof typeof voiceConfig];

    // Request to Google Cloud Text-to-Speech API
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: config.languageCode,
            name: config.name,
            ssmlGender: config.ssmlGender,
          },
          audioConfig: {
            audioEncoding: "MP3",
            pitch: 0,
            speakingRate: 0.95, // Slightly slower for clarity
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const error = await ttsResponse.json();
      console.error("Google Cloud TTS error:", error);
      return NextResponse.json(
        { error: `TTS generation failed: ${error?.error?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    const audioData = await ttsResponse.json();

    if (!audioData.audioContent) {
      return NextResponse.json(
        { error: "Failed to generate audio content" },
        { status: 500 }
      );
    }

    // Return base64 audio
    return NextResponse.json({
      success: true,
      audioContent: audioData.audioContent, // Base64 encoded MP3
      language,
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate audio",
      },
      { status: 500 }
    );
  }
}
