"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DossierJSON } from "@/types/dossier";

type Etape = "accueil" | "televersement" | "analyse" | "questions" | "termine" | "erreur";
type AudioLanguage = "fr" | "yo";
type Champ =
  | "activite_principale"
  | "nom_commercial"
  | "chiffre_affaires_annuel_fcfa"
  | "nombre_employes"
  | "autorise_publication_annuaire"
  | "promoteur.prenom"
  | "promoteur.nom"
  | "promoteur.piece_identite.numero";

const CHAMPS_OBLIGATOIRES: Champ[] = [
  "activite_principale",
  "nom_commercial",
  "chiffre_affaires_annuel_fcfa",
  "nombre_employes",
  "autorise_publication_annuaire",
  "promoteur.prenom",
  "promoteur.nom",
  "promoteur.piece_identite.numero",
];

const LIBELLES: Record<Champ, string> = {
  activite_principale: "Activite principale",
  nom_commercial: "Nom commercial",
  chiffre_affaires_annuel_fcfa: "Chiffre d'affaires annuel (FCFA)",
  nombre_employes: "Nombre d'employes",
  autorise_publication_annuaire: "Autorisation de publication",
  "promoteur.prenom": "Prenom du promoteur",
  "promoteur.nom": "Nom du promoteur",
  "promoteur.piece_identite.numero": "Numero de piece d'identite",
};

const QUESTIONS: Record<Champ, string> = {
  activite_principale: "Quelle est votre activite principale ?",
  nom_commercial: "Quel est le nom commercial de votre activite ?",
  chiffre_affaires_annuel_fcfa: "Quel est votre chiffre d'affaires annuel approximatif en FCFA ?",
  nombre_employes: "Combien d'employes avez-vous ?",
  autorise_publication_annuaire: "Autorisez-vous la publication de votre dossier dans l'annuaire ?",
  "promoteur.prenom": "Quel est votre prenom ?",
  "promoteur.nom": "Quel est votre nom de famille ?",
  "promoteur.piece_identite.numero": "Quel est le numero de votre piece d'identite ?",
};

const QUESTIONS_YO: Record<Champ, string> = {
  activite_principale: "Ise tabi isowo wo ni e n se gan an?",
  nom_commercial: "Kini oruko isowo yin?",
  chiffre_affaires_annuel_fcfa: "Owo melo ni isowo yin maa n ko wa lodun kan ni FCFA?",
  nombre_employes: "Abani sise melo ni e ni?",
  autorise_publication_annuaire: "Se e fe ki a fi alaye yin sinu atokoj oja? E so bee ni tabi rara.",
  "promoteur.prenom": "Kini oruko yin akoko?",
  "promoteur.nom": "Kini oruko idile yin?",
  "promoteur.piece_identite.numero": "Kini nomba iwe idanimo yin?",
};

const AUDIO_COPY: Record<AudioLanguage, Record<string, string>> = {
  fr: {
    welcome: "Bienvenue. Ajoutez vos documents pour commencer.",
    extracted: "J'ai termine la lecture des documents. Je vais maintenant poser les questions manquantes.",
    answerNow: "Vous pouvez repondre maintenant, a l'ecrit ou a l'oral.",
    complete: "Merci. Le dossier est maintenant complet.",
    submitted: "Le dossier a ete envoye avec succes.",
  },
  yo: {
    welcome: "E kaabo. E gbe awon iwe yin wa ki a bere.",
    extracted: "Mo ti ka awon iwe yin. Bayi, emi yoo bere awon ibeere to ku.",
    answerNow: "E le dahun bayi, nipa kikowe tabi nipa ohun.",
    complete: "Ese. Dossier naa ti pe bayi.",
    submitted: "A ti fi dossier naa ranse pelu aseyori.",
  },
};

const STATUTS: Record<Etape, { titre: string; sousTitre: string }> = {
  accueil: {
    titre: "Formalisation guidee",
    sousTitre: "Chargez vos documents pour commencer la constitution du dossier.",
  },
  televersement: {
    titre: "Documents prets",
    sousTitre: "Lancez l'analyse pour extraire les informations utiles.",
  },
  analyse: {
    titre: "Analyse Gemini",
    sousTitre: "Les pieces sont en cours de lecture et de structuration.",
  },
  questions: {
    titre: "Clarification orale",
    sousTitre: "Seuls les champs manquants sont demandes a l'utilisateur.",
  },
  termine: {
    titre: "Dossier complet",
    sousTitre: "Le dossier peut maintenant etre envoye dans Supabase.",
  },
  erreur: {
    titre: "Action requise",
    sousTitre: "Une erreur s'est produite. Verifiez les informations puis recommencez.",
  },
};

const ANIMATIONS = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: any, key) => acc?.[key], obj as any);
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let current: Record<string, unknown> = target;

  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;

    if (isLast) {
      current[part] = value;
      return;
    }

    const next = current[part];
    current[part] =
      next && typeof next === "object" && !Array.isArray(next)
        ? { ...(next as Record<string, unknown>) }
        : {};
    current = current[part] as Record<string, unknown>;
  });
}

function isMissing(value: unknown) {
  return value === undefined || value === null || value === "";
}

function getMissingFields(dossier: Partial<DossierJSON>) {
  return CHAMPS_OBLIGATOIRES.filter((champ) => isMissing(getNestedValue(dossier, champ)));
}

function normalizeAnswer(champ: Champ, valeur: string) {
  const clean = valeur.trim();

  if (!clean) {
    return clean;
  }

  if (champ === "autorise_publication_annuaire") {
    if (/^(oui|o|yes|true|1)$/i.test(clean)) {
      return true;
    }
    if (/^(non|n|no|false|0)$/i.test(clean)) {
      return false;
    }
  }

  if (champ === "nombre_employes" || champ === "chiffre_affaires_annuel_fcfa") {
    const digits = clean.replace(/[^\d]/g, "");
    return digits ? Number(digits) : clean;
  }

  return clean;
}

function UploadZone({
  fichiers,
  onFiles,
}: {
  fichiers: File[];
  onFiles: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    onFiles(Array.from(incoming));
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? "#1d9e75" : "#b7e8d5"}`,
        background: dragging ? "#ecfbf4" : "#f7fcfa",
        borderRadius: 22,
        padding: 28,
        minHeight: 190,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        style={{ display: "none" }}
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f6e56", marginBottom: 8 }}>
          Deposez vos pieces ici
        </div>
        <div style={{ color: "#587567", lineHeight: 1.7 }}>
          CNI, passeport, IFU, facture SBEE, attestations ou tout autre document utile.
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#7e8b86" }}>PNG, JPG ou PDF</div>

        {fichiers.length > 0 && (
          <div style={{ marginTop: 16, display: "grid", gap: 6 }}>
            {fichiers.map((file) => (
              <div key={file.name} style={{ fontSize: 13, color: "#0f6e56", fontWeight: 700 }}>
                {file.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MicButton({
  disabled,
  onResult,
}: {
  disabled: boolean;
  onResult: (text: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType });

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const formData = new FormData();
      formData.append("audio", blob, "reponse.webm");

      const response = await fetch("/api/formalisation/listen", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "La transcription a echoue.");
      }

      onResult(String(payload.text || payload.valeur_extraite || ""));
    };

    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled}
      style={{
        width: 84,
        height: 84,
        borderRadius: "50%",
        border: "none",
        background: recording ? "#e74c3c" : "#1d9e75",
        color: "#ffffff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: "0 10px 30px rgba(29, 158, 117, 0.25)",
        fontSize: 28,
      }}
      aria-label={recording ? "Arreter l'enregistrement" : "Demarrer l'enregistrement"}
    >
      {recording ? "■" : "🎙"}
    </button>
  );
}

export default function FormalisationPage() {
  const [etape, setEtape] = useState<Etape>("accueil");
  const [audioLanguage, setAudioLanguage] = useState<AudioLanguage>("yo");
  const [dossier, setDossier] = useState<Partial<DossierJSON>>({});
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [champsManquants, setChampsManquants] = useState<Champ[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [reponse, setReponse] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [message, setMessage] = useState("Ajoutez des documents pour demarrer.");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingSpeak, setLoadingSpeak] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const lastSpokenTextRef = useRef("");
  const lastSpokenLanguageRef = useRef<AudioLanguage>("fr");

  const resume = useMemo(() => dossier, [dossier]);
  const currentQuestionField = champsManquants[questionIndex];

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (etape !== "accueil") {
      return;
    }

    void speak(AUDIO_COPY[audioLanguage].welcome, audioLanguage);
  }, [audioLanguage, etape]);

  useEffect(() => {
    if (etape !== "questions" || !audioRef.current) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void replayAudio();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [etape, questionIndex]);

  const speak = async (texte: string, language: AudioLanguage = "fr") => {
    setLoadingSpeak(true);
    lastSpokenTextRef.current = texte;
    lastSpokenLanguageRef.current = language;

    try {
      const response = await fetch("/api/formalisation/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texte, language }),
      });

      if (!response.ok) {
        throw new Error("tts_unavailable");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        void audio.play().catch(() => resolve());
      });
    } catch {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(texte);
        utterance.lang = language === "yo" ? "yo-NG" : "fr-FR";
        utterance.rate = 0.92;
        utterance.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setLoadingSpeak(false);
    }
  };

  const replayAudio = async () => {
    const audio = audioRef.current;
    if (!audio) {
      if (lastSpokenTextRef.current) {
        await speak(lastSpokenTextRef.current, lastSpokenLanguageRef.current);
      }
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // Ignore browser autoplay restrictions here.
    }
  };

  const speakQuestion = async (champ: Champ) => {
    const spokenQuestion = audioLanguage === "yo" ? QUESTIONS_YO[champ] : QUESTIONS[champ];
    await speak(spokenQuestion, audioLanguage);
    await speak(AUDIO_COPY[audioLanguage].answerNow, audioLanguage);
  };

  const commencerAnalyse = async () => {
    if (fichiers.length === 0) {
      setError("Ajoutez au moins un document avant de lancer l'analyse.");
      setEtape("erreur");
      return;
    }

    setEtape("analyse");
    setError("");
    setMessage("Lecture des documents en cours...");

    const formData = new FormData();
    fichiers.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/formalisation/extract", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "L'extraction a echoue.");
      }

      const extrait = payload as Partial<DossierJSON>;
      const manquants = getMissingFields(extrait);

      setDossier(extrait);
      setChampsManquants(manquants);

      if (manquants.length === 0) {
        setEtape("termine");
        setMessage("Tous les champs essentiels sont deja remplis.");
        await speak(AUDIO_COPY[audioLanguage].complete, audioLanguage);
        return;
      }

      setEtape("questions");
      setQuestionIndex(0);
      setMessage(QUESTIONS[manquants[0]]);
      await speak(AUDIO_COPY[audioLanguage].extracted, audioLanguage);
      await speakQuestion(manquants[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'extraction a echoue.");
      setEtape("erreur");
    }
  };

  const traiterReponse = async (texte: string) => {
    const champ = champsManquants[questionIndex];
    if (!champ) return;

    const copie = { ...dossier } as Record<string, unknown>;
    const valeur = normalizeAnswer(champ, texte);

    setNestedValue(copie, champ, valeur);
    setDossier(copie as Partial<DossierJSON>);
    setReponse(texte);
    setManualAnswer("");

    const suivant = questionIndex + 1;
    if (suivant >= champsManquants.length) {
      setEtape("termine");
      setMessage("Le dossier est complet. Vous pouvez maintenant l'envoyer.");
      await speak(AUDIO_COPY[audioLanguage].complete, audioLanguage);
      return;
    }

    setQuestionIndex(suivant);
    setMessage(QUESTIONS[champsManquants[suivant]]);
    await speakQuestion(champsManquants[suivant]);
  };

  const envoyerDossier = async () => {
    setLoadingSubmit(true);
    setError("");

    try {
      const response = await fetch("/api/formalisation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dossier),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "L'envoi du dossier a echoue.");
      }

      setMessage(payload?.message || "Dossier envoye avec succes.");
      await speak(AUDIO_COPY[audioLanguage].submitted, audioLanguage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi du dossier a echoue.");
      setEtape("erreur");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const texteFichiers = fichiers.length
    ? `${fichiers.length} fichier${fichiers.length > 1 ? "s" : ""} pret${fichiers.length > 1 ? "s" : ""}`
    : "Aucun fichier selectionne";

  return (
    <>
      <style>{ANIMATIONS}</style>
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top left, rgba(29, 158, 117, 0.15), transparent 34%), linear-gradient(180deg, #f7fcfa 0%, #eef8f4 100%)",
          padding: "32px 20px 60px",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: "#103428",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 24 }}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
              animation: "fadeUp 0.4s ease",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1d9e75", letterSpacing: "0.08em" }}>
                FORMALISATION
              </div>
              <h1 style={{ margin: "10px 0 8px", fontSize: 38, lineHeight: 1.1, fontWeight: 800 }}>
                Dossier guide et conversationnel
              </h1>
              <p style={{ margin: 0, maxWidth: 720, color: "#567064", fontSize: 16, lineHeight: 1.7 }}>
                Vous televersez les pieces, Gemini extrait le dossier, puis l'assistant pose
                uniquement les questions utiles avant la soumission.
              </p>
            </div>

            <div
              style={{
                minWidth: 260,
                padding: "16px 18px",
                borderRadius: 18,
                background: "#ffffff",
                border: "1px solid #d7eee6",
                boxShadow: "0 12px 40px rgba(15, 110, 86, 0.08)",
              }}
            >
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6a7f77" }}>
                Etat
              </div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>{STATUTS[etape].titre}</div>
              <div style={{ marginTop: 6, color: "#5b7068", lineHeight: 1.6 }}>{STATUTS[etape].sousTitre}</div>
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setAudioLanguage("yo")}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: audioLanguage === "yo" ? "#1d9e75" : "#edf5f1",
                    color: audioLanguage === "yo" ? "#ffffff" : "#315848",
                  }}
                >
                  Audio Yoruba
                </button>
                <button
                  type="button"
                  onClick={() => setAudioLanguage("fr")}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: audioLanguage === "fr" ? "#1d9e75" : "#edf5f1",
                    color: audioLanguage === "fr" ? "#ffffff" : "#315848",
                  }}
                >
                  Audio Francais
                </button>
              </div>
            </div>
          </header>

          <main
            style={{
              display: "grid",
              gridTemplateColumns: "1.15fr 0.85fr",
              gap: 24,
              alignItems: "start",
            }}
          >
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #dcefe7",
                borderRadius: 28,
                padding: 24,
                boxShadow: "0 18px 50px rgba(15, 110, 86, 0.08)",
                animation: "fadeUp 0.45s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#6b8179", fontWeight: 700, letterSpacing: "0.04em" }}>
                    {STATUTS[etape].titre}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 17, fontWeight: 700 }}>{STATUTS[etape].sousTitre}</div>
                </div>
                {(loadingSpeak || loadingSubmit) && (
                  <div style={{ fontSize: 13, color: "#1d9e75", fontWeight: 700 }}>
                    {loadingSpeak ? "Audio..." : "Envoi..."}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={replayAudio}
                  disabled={!audioRef.current || loadingSpeak}
                  style={{
                    border: "1px solid #d7eee6",
                    background: "#ffffff",
                    color: "#0f6e56",
                    padding: "11px 14px",
                    borderRadius: 12,
                    fontWeight: 700,
                    cursor: !audioRef.current || loadingSpeak ? "not-allowed" : "pointer",
                  }}
                >
                  Reecouter l'audio
                </button>
              </div>

              <div style={{ marginTop: 22 }}>
                {(etape === "accueil" || etape === "televersement" || etape === "erreur") && (
                  <div style={{ display: "grid", gap: 16 }}>
                    <UploadZone
                      fichiers={fichiers}
                      onFiles={(list) => {
                        setFichiers(list);
                        setEtape("televersement");
                        setError("");
                        setMessage("Documents prets. Lancez l'analyse.");
                      }}
                    />

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={commencerAnalyse}
                        disabled={fichiers.length === 0}
                        style={{
                          border: "none",
                          background: "#1d9e75",
                          color: "#ffffff",
                          padding: "14px 18px",
                          borderRadius: 14,
                          fontWeight: 700,
                          cursor: fichiers.length === 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        Analyser les documents
                      </button>
                      <div style={{ alignSelf: "center", color: "#6b8179", fontSize: 14 }}>{texteFichiers}</div>
                    </div>

                    <div style={{ fontSize: 14, color: "#567064", lineHeight: 1.7 }}>
                      Le service utilise Gemini Vision pour structurer le dossier. Si des informations
                      manquent, l'assistant les demande ensuite a l'oral.
                    </div>

                    {error && (
                      <div
                        style={{
                          padding: "14px 16px",
                          borderRadius: 14,
                          background: "#fff2f2",
                          color: "#b42222",
                          border: "1px solid #f3c2c2",
                        }}
                      >
                        {error}
                      </div>
                    )}
                  </div>
                )}

                {etape === "analyse" && (
                  <div style={{ display: "grid", placeItems: "center", gap: 16, padding: "36px 0" }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: "50%",
                        border: "4px solid #dff3ec",
                        borderTopColor: "#1d9e75",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <div style={{ textAlign: "center", color: "#5b7068", lineHeight: 1.7 }}>
                      Gemini lit les images et les PDF, puis prepare le dossier.
                    </div>
                  </div>
                )}

                {etape === "questions" && (
                  <div style={{ display: "grid", gap: 18 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {champsManquants.map((_, index) => (
                        <div
                          key={index}
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 999,
                            background: index <= questionIndex ? "#1d9e75" : "#dff3ec",
                          }}
                        />
                      ))}
                    </div>

                    <div
                      style={{
                        borderRadius: 20,
                        background: "#f2faf6",
                        border: "1px solid #dbeee5",
                        padding: 20,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#1d9e75", fontWeight: 800, letterSpacing: "0.08em" }}>
                        QUESTION {questionIndex + 1} / {champsManquants.length}
                      </div>
                      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700, lineHeight: 1.6 }}>{message}</div>
                      <div style={{ marginTop: 10, color: "#6b8179", fontSize: 14 }}>
                        Champ attendu : {currentQuestionField ? LIBELLES[currentQuestionField] : "-"}
                      </div>
                      <div style={{ marginTop: 10, color: "#6b8179", fontSize: 13 }}>
                        Le texte reste en francais et l'audio se repete toutes les 5 secondes pendant cette etape.
                      </div>
                    </div>

                    <div style={{ display: "grid", placeItems: "center", gap: 12 }}>
                      <MicButton disabled={loadingSpeak} onResult={traiterReponse} />
                      <div style={{ color: "#60756c", fontSize: 13 }}>
                        Vous pouvez repondre au micro ou ecrire directement la reponse ci-dessous.
                      </div>
                      <div style={{ width: "100%", display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <input
                          value={manualAnswer}
                          onChange={(event) => setManualAnswer(event.target.value)}
                          placeholder="Ecrivez votre reponse ici"
                          style={{
                            flex: 1,
                            minWidth: 220,
                            border: "1px solid #dcefe7",
                            borderRadius: 14,
                            padding: "12px 14px",
                            fontSize: 14,
                            color: "#103428",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => void traiterReponse(manualAnswer)}
                          disabled={manualAnswer.trim().length === 0 || loadingSpeak}
                          style={{
                            border: "none",
                            background: "#1d9e75",
                            color: "#ffffff",
                            padding: "12px 16px",
                            borderRadius: 14,
                            fontWeight: 700,
                            cursor:
                              manualAnswer.trim().length === 0 || loadingSpeak ? "not-allowed" : "pointer",
                          }}
                        >
                          Envoyer la reponse
                        </button>
                      </div>
                      {reponse && (
                        <div
                          style={{
                            width: "100%",
                            border: "1px solid #dcefe7",
                            borderRadius: 16,
                            padding: "12px 14px",
                            color: "#103428",
                            background: "#ffffff",
                          }}
                        >
                          <strong>Derniere reponse :</strong> {reponse}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {etape === "termine" && (
                  <div style={{ display: "grid", gap: 18 }}>
                    <div
                      style={{
                        padding: 18,
                        borderRadius: 18,
                        background: "#f2faf6",
                        border: "1px solid #dbeee5",
                        color: "#567064",
                        lineHeight: 1.7,
                      }}
                    >
                      {message}
                    </div>

                    <button
                      type="button"
                      onClick={envoyerDossier}
                      disabled={loadingSubmit}
                      style={{
                        border: "none",
                        background: "#0f6e56",
                        color: "#ffffff",
                        padding: "15px 18px",
                        borderRadius: 14,
                        fontWeight: 800,
                        cursor: loadingSubmit ? "not-allowed" : "pointer",
                        boxShadow: "0 16px 32px rgba(15, 110, 86, 0.2)",
                      }}
                    >
                      {loadingSubmit ? "Envoi en cours..." : "Envoyer le dossier"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <aside
              style={{
                background: "#ffffff",
                border: "1px solid #dcefe7",
                borderRadius: 28,
                padding: 24,
                boxShadow: "0 18px 50px rgba(15, 110, 86, 0.08)",
                display: "grid",
                gap: 20,
                animation: "fadeUp 0.5s ease",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "#6b8179", fontWeight: 700, letterSpacing: "0.08em" }}>
                  RESUME DU DOSSIER
                </div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>
                  {Object.keys(resume).length > 0 ? "Informations extraites" : "En attente d'extraction"}
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {CHAMPS_OBLIGATOIRES.map((champ) => {
                  const valeur = getNestedValue(resume, champ);

                  return (
                    <div
                      key={champ}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        paddingBottom: 10,
                        borderBottom: "1px solid #edf5f1",
                        alignItems: "baseline",
                      }}
                    >
                      <div style={{ color: "#6b8179", fontSize: 14 }}>{LIBELLES[champ]}</div>
                      <div style={{ color: "#103428", fontWeight: 700, textAlign: "right", fontSize: 14 }}>
                        {typeof valeur === "boolean"
                          ? valeur
                            ? "Oui"
                            : "Non"
                          : isMissing(valeur)
                            ? "-"
                            : String(valeur)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 18,
                  background: "#fafcfb",
                  border: "1px solid #e4f2eb",
                  color: "#5b7068",
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                Routes actives :
                <div style={{ marginTop: 8, display: "grid", gap: 4, color: "#103428", fontWeight: 700 }}>
                  <div>/api/formalisation/extract</div>
                  <div>/api/formalisation/listen</div>
                  <div>/api/formalisation/speak</div>
                  <div>/api/formalisation/submit</div>
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </>
  );
}
