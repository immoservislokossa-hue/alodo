import { NextRequest, NextResponse } from "next/server";

// Cache pour éviter de régénérer le même audio
const audioCache = new Map<string, { audio: string; expiresAt: number }>();

// Fonction de conversion PCM -> WAV
function pcmToWav(pcmBase64: string, sampleRate: number = 24000): string {
  // Décoder le base64 PCM
  const binaryString = Buffer.from(pcmBase64, 'base64').toString('binary');
  const pcmBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }
  
  // Paramètres WAV
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  // Fonction utilitaire pour écrire des chaînes
  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
  
  // Écrire l'en-tête WAV
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Copier les données PCM
  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(pcmBytes);
  
  // Retourner en base64
  const wavBuffer = Buffer.from(buffer);
  return wavBuffer.toString('base64');
}

// Options de voix pour différentes tonalités
const voiceOptions = {
  fr: {
    voiceName: "Kore",
    styleInstructions: `Parle avec un rythme modéré et clair.
    Utilise des pauses naturelles entre les phrases.
    Ne parle ni trop vite ni trop lentement.
    Articule clairement chaque mot.
    Durée cible : 45 secondes maximum.`
  },
  yor: {
    voiceName: "Puck",
    styleInstructions: `Speak at a moderate, clear pace.
    Use natural pauses between sentences.
    Neither too fast nor too slow.
    Enunciate each word clearly.
    Target duration: 45 seconds maximum.`
  }
};

export async function POST(req: NextRequest) {
  try {
    let { text, language } = await req.json();

    // Validation
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Le texte est requis et doit être une chaîne non vide" },
        { status: 400 }
      );
    }

    if (!language || !["fr", "yor"].includes(language)) {
      return NextResponse.json(
        { error: "La langue doit être 'fr' ou 'yor'" },
        { status: 400 }
      );
    }

    // Estimation de la durée approximative
    const wordCount = text.trim().split(/\s+/).length;
    const estimatedDuration = wordCount / 2.5;
    
    console.log(`Texte: ${wordCount} mots, durée estimée: ${Math.round(estimatedDuration)}s`);

    // Si le texte est trop long, on le tronque
    if (estimatedDuration > 55) {
      console.warn(`Texte trop long (${Math.round(estimatedDuration)}s), troncature...`);
      const maxWords = 110;
      const words = text.trim().split(/\s+/);
      const truncatedText = words.slice(0, maxWords).join(" ");
      text = truncatedText + "...";
    }

    // Vérification du cache
    const cacheKey = `${language}:${text.trim()}`;
    const cached = audioCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`Cache hit pour ${language}`);
      return NextResponse.json({
        success: true,
        audioContent: cached.audio,
        language,
        cached: true,
        estimatedDuration: Math.round(estimatedDuration),
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY non configurée");
      return NextResponse.json(
        { error: "Clé API Gemini non configurée" },
        { status: 500 }
      );
    }

    const voice = voiceOptions[language as keyof typeof voiceOptions];
    
    const prompt = language === "fr" 
      ? `# AUDIO PROFILE: Animateur Radio
## "La Voix Claire"

## THE SCENE: Studio d'enregistrement calme
C'est un studio professionnel insonorisé. L'ambiance est sereine et concentrée. 
L'animateur est assis confortablement, le micro à bonne distance.

### DIRECTOR'S NOTES
Style: Clair, professionnel, chaleureux mais mesuré.
Pacing: ${voice.styleInstructions}
Articulation: Nette et précise.
Émotion: Neutre et informatif, comme une annonce officielle.

#### TRANSCRIPT
${text}`

      : `# AUDIO PROFILE: Radio Announcer
## "The Clear Voice"

## THE SCENE: Quiet recording studio
A professional sound-proof studio. The atmosphere is calm and focused.
The announcer is seated comfortably, microphone at proper distance.

### DIRECTOR'S NOTES
Style: Clear, professional, warm but measured.
Pacing: ${voice.styleInstructions}
Articulation: Sharp and precise.
Emotion: Neutral and informative, like a public announcement.

#### TRANSCRIPT
${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice.voiceName,
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini TTS API error:", errorData);
      console.log("Fallback vers version simplifiée...");
      return simplifiedTTS(text, language, apiKey);
    }

    const data = await response.json();
    const pcmAudioContent = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!pcmAudioContent) {
      throw new Error("Aucun contenu audio généré");
    }

    // Conversion du PCM en WAV
    const wavAudioContent = pcmToWav(pcmAudioContent, 24000);

    // Mise en cache pour 1 heure
    audioCache.set(cacheKey, {
      audio: wavAudioContent,
      expiresAt: Date.now() + 3600000,
    });

    return NextResponse.json({
      success: true,
      audioContent: wavAudioContent,
      language,
      model: "gemini-2.5-flash-preview-tts",
      estimatedDuration: Math.round(estimatedDuration),
      wordCount: text.trim().split(/\s+/).length,
    });

  } catch (error) {
    console.error("Erreur génération TTS:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Échec de la génération audio",
      },
      { status: 500 }
    );
  }
}

async function simplifiedTTS(text: string, language: string, apiKey: string) {
  const voiceName = language === "fr" ? "Kore" : "Puck";
  const instruction = language === "fr" 
    ? "Parle clairement et à un rythme modéré pour que l'audio dure maximum 45 secondes."
    : "Speak clearly at a moderate pace so the audio lasts maximum 45 seconds.";

  const prompt = `${instruction}\n\nTexte: ${text}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      }),
    }
  );

  const data = await response.json();
  const pcmAudioContent = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!pcmAudioContent) {
    throw new Error("Aucun contenu audio généré");
  }
  
  // Conversion du PCM en WAV pour le fallback aussi
  const wavAudioContent = pcmToWav(pcmAudioContent, 24000);
  
  return NextResponse.json({
    success: true,
    audioContent: wavAudioContent,
    language,
    model: "gemini-2.5-flash-preview-tts-fallback",
  });
}