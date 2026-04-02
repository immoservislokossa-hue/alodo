import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Texte requis pour la génération TTS" },
        { status: 400 }
      );
    }

    // Utiliser l'API Gemini pour la génération de contenu texte
    // (Gemini ne dispose pas d'une API TTS native)
    // Pour une véritable TTS, utiliser Google Cloud Text-to-Speech ou une autre API

    // Pour maintenant, retourner une erreur indiquant que la TTS n'est pas disponible
    return NextResponse.json(
      { error: "La fonctionnalité TTS n'est pas encore configurée" },
      { status: 501 }
    );

  } catch (error: any) {
    console.error("Erreur TTS:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération audio" },
      { status: 500 }
    );
  }
}