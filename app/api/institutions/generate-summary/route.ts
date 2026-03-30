import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Cache mémoire pour éviter de re-solliciter l'API pour la même description
const ongoingRequestsMap = new Map<string, { promise: Promise<any>; expiresAt: number }>();

// Rate limiting global
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const GLOBAL_RATE_LIMIT = 5; // 5 requêtes
const GLOBAL_WINDOW_MS = 60000; // par 60 secondes

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + GLOBAL_WINDOW_MS });
    return { allowed: true };
  }
  
  if (now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + GLOBAL_WINDOW_MS });
    return { allowed: true };
  }
  
  if (entry.count >= GLOBAL_RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  entry.count++;
  return { allowed: true };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    const { description } = await req.json();

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: "Description trop courte (minimum 10 caractères)" }, { status: 400 });
    }

    // Rate limiting
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: `Trop de requêtes. Veuillez patienter ${rateLimitCheck.retryAfter} secondes.`,
          retryAfter: rateLimitCheck.retryAfter
        }, 
        { 
          status: 429,
          headers: { 'Retry-After': String(rateLimitCheck.retryAfter) }
        }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY non configurée");
      return NextResponse.json({ error: "Clé API non configurée sur le serveur" }, { status: 500 });
    } 
    
    // Déduplication
    const hash = crypto.createHash("sha256").update(description.trim()).digest("hex");
    const now = Date.now();
    
    if (ongoingRequestsMap.has(hash) && ongoingRequestsMap.get(hash)!.expiresAt > now) {
      console.log("Récupération du cache pour :", hash.substring(0, 8));
      const result = await ongoingRequestsMap.get(hash)!.promise;
      return NextResponse.json(result);
    }

    // Prompt optimisé
    const prompt = `Fais un résumé du texte suivant en Français et en Yoruba.
    Règles :
    - Exactement 3 phrases courtes par langue.
    - Un seul paragraphe compact par langue.
    - Ton fluide pour audio de 45 secondes.
    - Réponds UNIQUEMENT au format JSON valide avec cette structure: {"fr": "résumé français", "yor": "résumé yoruba"}
    - N'ajoute aucun texte avant ou après le JSON.
    
    Texte à résumer : ${description}`;

    // Appel à Gemini avec retry
    const callGeminiWithRetry = async (retryCount = 0): Promise<any> => {
      try {
        // UTILISATION D'UN MODÈLE STABLE
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
              }
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429 && retryCount < 3) {
            const waitTime = Math.pow(2, retryCount) * 1000;
            console.log(`429 - Retry ${retryCount + 1}/3 dans ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return callGeminiWithRetry(retryCount + 1);
          }
          
          console.error("Erreur Gemini:", data);
          throw new Error(data.error?.message || `Erreur API Gemini (${response.status})`);
        }

        return data;
      } catch (error) {
        if (retryCount < 3) {
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`Erreur - Retry ${retryCount + 1}/3 dans ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return callGeminiWithRetry(retryCount + 1);
        }
        throw error;
      }
    };

    const generationPromise = (async () => {
      const data = await callGeminiWithRetry();
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("Gemini n'a renvoyé aucun contenu.");
      }

      // Nettoyer et parser le JSON
      let cleanedContent = content.trim();
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      try {
        const parsed = JSON.parse(cleanedContent);
        
        if (!parsed.fr || !parsed.yor) {
          throw new Error("Structure JSON invalide - champs fr et yor requis");
        }
        
        return { success: true, summaries: parsed };
      } catch (parseError) {
        console.error("Erreur parsing JSON:", cleanedContent);
        throw new Error("Le résumé généré n'est pas au format JSON valide");
      }
    })();

    // Cache pour 60 secondes
    ongoingRequestsMap.set(hash, { promise: generationPromise, expiresAt: now + 60000 });

    // Nettoyage automatique du cache
    setTimeout(() => {
      if (ongoingRequestsMap.has(hash)) {
        const cached = ongoingRequestsMap.get(hash);
        if (cached && cached.expiresAt <= Date.now()) {
          ongoingRequestsMap.delete(hash);
        }
      }
    }, 61000);

    const result = await generationPromise;
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("ERREUR :", error.message);
    
    const status = error.message.includes("429") ? 429 : 
                   error.message.includes("Quota") ? 429 : 500;
                   
    return NextResponse.json(
      { error: error.message || "Erreur lors de la génération du résumé" },
      { status }
    );
  }
}

// Nettoyer le rate limit périodiquement
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);