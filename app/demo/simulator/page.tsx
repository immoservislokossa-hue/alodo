"use client";

import { useEffect, useState, useRef } from "react";
import supabase from "@/src/lib/supabase/browser";
import { Loader2 } from "lucide-react";

type USSDMessage = {
  id: string;
  type: "user" | "system";
  content: string;
  timestamp: Date;
};

type Opportunity = {
  id: string;
  titre: string;
  institution_nom: string;
  montant_min_fcfa?: number;
  montant_max_fcfa?: number;
  date_limite?: string;
  description: string;
  score_match?: number;
  can_apply: boolean;
};

type USSDState = 
  | "loading_profile"
  | "opportunities_list"
  | "opportunity_detail"
  | "applying"
  | "confirmation";

export default function USSDTerminal() {
  const [messages, setMessages] = useState<USSDMessage[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<USSDState>("loading_profile");
  const [profile, setProfile] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCounterRef = useRef(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    
    const initUSSD = async () => {
      await loadUserProfile();
    };
    initUSSD();
    
    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: "user" | "system", content: string) => {
    const newMessage: USSDMessage = {
      id: `msg-${++messageCounterRef.current}`,
      type,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        addMessage("system", "ERREUR: UTILISATEUR NON CONNECTE");
        addMessage("system", "VEUILLEZ VOUS CONNECTER SUR L'APPLICATION");
        setState("confirmation");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profileData) {
        addMessage("system", "ERREUR: PROFIL NON TROUVE");
        addMessage("system", "VEUILLEZ COMPLETER VOTRE PROFIL");
        setState("confirmation");
        return;
      }

      setProfile(profileData);
      setPhoneNumber(profileData.phone || "NON RENSEIGNE");
      
      addMessage("system", `PROFIL CHARGE: ${profileData.type?.toUpperCase() || "UTILISATEUR"}`);
      addMessage("system", `TELEPHONE: +${profileData.phone || "NON RENSEIGNE"}`);
      
      await loadOpportunities(profileData.id);
      
    } catch (error) {
      console.error(error);
      addMessage("system", "ERREUR DE CONNEXION");
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunities = async (profileId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ussd/opportunities?profileId=${profileId}`);
      const data = await response.json();

      if (!data.success) {
        addMessage("system", `ERREUR: ${data.error}`);
        setState("confirmation");
        return;
      }

      setOpportunities(data.opportunities);

      if (data.opportunities.length === 0) {
        addMessage("system", "AUCUNE OPPORTUNITE DISPONIBLE");
        addMessage("system", "VEUILLEZ REVENIR PLUS TARD");
        setState("confirmation");
        return;
      }

      let message = "\n";
      message += "OPPORTUNITES DISPONIBLES\n";
      message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
      
      data.opportunities.forEach((opp: Opportunity, index: number) => {
        const minMontant = opp.montant_min_fcfa ? `${(opp.montant_min_fcfa / 1000).toFixed(0)}K` : "N/D";
        const maxMontant = opp.montant_max_fcfa ? `${(opp.montant_max_fcfa / 1000).toFixed(0)}K` : "N/D";
        
        message += `${index + 1}. ${opp.titre}\n`;
        message += `   MONTANT: ${minMontant} - ${maxMontant} FCFA\n`;
        message += `   ENTREPRISE: ${opp.institution_nom}\n`;
        if (opp.score_match) {
          message += `   MATCH: ${opp.score_match}%\n`;
        }
        message += "\n";
      });
      
      message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      message += "TAPEZ LE NUMERO POUR VOIR DETAILS\n";
      message += "TAPEZ 0 POUR QUITTER";
      
      addMessage("system", message);
      setState("opportunities_list");
      
    } catch (error) {
      console.error(error);
      addMessage("system", "ERREUR DE CHARGEMENT DES OPPORTUNITES");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (loading || state === "confirmation") return;
    
    const newInput = input + key;
    setInput(newInput);
    
    if (key === "#" || (newInput.length === 1 && !isNaN(parseInt(key)))) {
      setTimeout(() => {
        sendMessage(newInput);
      }, 100);
    }
  };

  const handleSend = () => {
    if (input.trim() && !loading && state !== "confirmation") {
      sendMessage(input);
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim() || loading) return;
    
    addMessage("user", userInput);
    setInput("");
    
    if (state === "opportunities_list") {
      if (userInput === "0") {
        addMessage("system", "\nSESSION TERMINEE");
        addMessage("system", "MERCI D'AVOIR UTILISE ALODO USSD");
        setState("confirmation");
      } else {
        const index = parseInt(userInput) - 1;
        if (!isNaN(index) && index >= 0 && index < opportunities.length) {
          const selected = opportunities[index];
          setSelectedOpportunity(selected);
          
          const minMontant = selected.montant_min_fcfa ? `${(selected.montant_min_fcfa / 1000).toFixed(0)}K` : "N/D";
          const maxMontant = selected.montant_max_fcfa ? `${(selected.montant_max_fcfa / 1000).toFixed(0)}K` : "N/D";
          
          let detail = "\n";
          detail += "DETAILS DE L'OPPORTUNITE\n";
          detail += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
          detail += `${selected.titre}\n\n`;
          detail += `ENTREPRISE: ${selected.institution_nom}\n\n`;
          detail += `REMUNERATION: ${minMontant} - ${maxMontant} FCFA\n\n`;
          if (selected.date_limite) {
            const date = new Date(selected.date_limite);
            detail += `DATE LIMITE: ${date.toLocaleDateString('fr-FR')}\n\n`;
          }
          detail += `DESCRIPTION:\n${selected.description}\n\n`;
          if (selected.score_match) {
            detail += `SCORE DE MATCHING: ${selected.score_match}%\n\n`;
          }
          detail += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
          detail += "TAPEZ 1 POUR POSTULER\n";
          detail += "TAPEZ 0 POUR RETOUR";
          
          addMessage("system", detail);
          setState("opportunity_detail");
        } else {
          addMessage("system", `OPTION INVALIDE. TAPEZ 1-${opportunities.length} OU 0`);
        }
      }
    } 
    else if (state === "opportunity_detail") {
      if (userInput === "1") {
        if (!selectedOpportunity?.can_apply) {
          addMessage("system", "VOUS NE POUVEZ PAS POSTULER A CETTE OPPORTUNITE");
          addMessage("system", "SCORE DE MATCHING INSUFFISANT");
          setState("opportunities_list");
          return;
        }
        
        addMessage("system", "TRAITEMENT DE LA CANDIDATURE...");
        setState("applying");
        await submitApplication();
      } else if (userInput === "0") {
        let message = "\n";
        message += "OPPORTUNITES DISPONIBLES\n";
        message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        
        opportunities.forEach((opp, index) => {
          const minMontant = opp.montant_min_fcfa ? `${(opp.montant_min_fcfa / 1000).toFixed(0)}K` : "N/D";
          const maxMontant = opp.montant_max_fcfa ? `${(opp.montant_max_fcfa / 1000).toFixed(0)}K` : "N/D";
          
          message += `${index + 1}. ${opp.titre}\n`;
          message += `   MONTANT: ${minMontant} - ${maxMontant} FCFA\n`;
          message += `   ENTREPRISE: ${opp.institution_nom}\n`;
          if (opp.score_match) {
            message += `   MATCH: ${opp.score_match}%\n`;
          }
          message += "\n";
        });
        
        message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        message += "TAPEZ LE NUMERO POUR VOIR DETAILS\n";
        message += "TAPEZ 0 POUR QUITTER";
        
        addMessage("system", message);
        setState("opportunities_list");
      } else {
        addMessage("system", "OPTION INVALIDE. TAPEZ 1 POUR POSTULER OU 0 POUR RETOUR");
      }
    }
    else if (state === "confirmation") {
      if (userInput === "0") {
        window.location.reload();
      }
    }
  };

  const submitApplication = async () => {
    try {
      const response = await fetch("/api/ussd/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          opportunityId: selectedOpportunity?.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        let message = "\n";
        message += "CANDIDATURE ENVOYEE AVEC SUCCES\n";
        message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        message += `OPPORTUNITE: ${selectedOpportunity?.titre}\n`;
        message += `ENTREPRISE: ${selectedOpportunity?.institution_nom}\n\n`;
        message += `VOUS SEREZ CONTACTE DANS LES 24H\n`;
        message += `SUR VOTRE NUMERO: +${phoneNumber}\n\n`;
        message += `REFERENCE: ${data.reference}\n\n`;
        message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        message += "TAPEZ 0 POUR QUITTER";
        
        addMessage("system", message);
        
        await supabase
          .from("post_institution_matches")
          .update({ seen_at: new Date().toISOString() })
          .eq("profile_id", profile.id)
          .eq("post_institution_id", selectedOpportunity?.id);
          
        setState("confirmation");
        
      } else {
        addMessage("system", `ERREUR: ${data.error}`);
        addMessage("system", "TAPEZ 0 POUR QUITTER");
        setState("confirmation");
      }
      
    } catch (error) {
      console.error(error);
      addMessage("system", "ERREUR TECHNIQUE. VEUILLEZ REESSAYER");
      addMessage("system", "TAPEZ 0 POUR QUITTER");
      setState("confirmation");
    }
  };

  const formatTime = () => {
    return currentTime || "--:--";
  };

  const keypadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"]
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 flex items-center justify-center p-4">
      <div className="relative w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-400">
        
        {/* Dynamic Island */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-10">
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-gray-700 rounded-full"></div>
        </div>
        
        <div className="pt-8 pb-2">
          {/* Status Bar */}
          <div className="bg-white text-gray-800 px-4 py-1 flex justify-between text-xs border-b border-gray-200">
            <span className="font-semibold">{formatTime()}</span>
            <span className="font-mono font-medium">{phoneNumber}</span>
            <div className="flex gap-1">
              <span>📶</span>
              <span>🔋</span>
            </div>
          </div>
          
          {/* USSD Header */}
          <div className="bg-gray-100 text-gray-700 px-4 py-2 text-sm font-mono border-b border-gray-200">
            <div className="flex justify-between">
              <span className="font-semibold">ALODO USSD</span>
              <span className="font-bold text-blue-600">*202#</span>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="h-[420px] overflow-y-auto bg-white text-gray-800 p-3 font-mono text-sm">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span>INITIALISATION...</span>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`mb-3 ${msg.type === "user" ? "text-right" : "text-left"}`}>
                    {msg.type === "user" ? (
                      <div className="inline-block bg-blue-500 text-white px-3 py-2 rounded-lg shadow-sm">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words leading-relaxed text-sm text-gray-700">
                        {msg.content}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-gray-500 mt-2">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-xs">TRAITEMENT...</span>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Display */}
          {state !== "confirmation" && (
            <div className="bg-white border-t border-gray-200 px-4 py-2">
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-gray-800 font-mono text-lg text-center shadow-inner">
                {input || "▯"}
              </div>
            </div>
          )}
        </div>
        
        {/* Keypad with 3D Effect */}
        {state !== "confirmation" && (
          <div className="bg-gray-100 pb-4">
            <div className="grid grid-cols-3 gap-2 px-3 py-3">
              {keypadButtons.map((row, rowIndex) => (
                <div key={rowIndex} className="contents">
                  {row.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      className="bg-gradient-to-b from-white to-gray-200 hover:from-gray-100 hover:to-gray-300 active:from-gray-300 active:to-gray-400 text-gray-800 text-2xl font-bold py-5 rounded-2xl transition-all duration-100 shadow-[0_4px_0_0_#9ca3af] active:shadow-[0_1px_0_0_#9ca3af] active:translate-y-[2px]"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 px-3 mt-2">
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex-1 bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 text-white font-bold py-4 rounded-2xl transition-all duration-100 shadow-[0_4px_0_0_#166534] active:shadow-[0_1px_0_0_#166534] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0"
              >
                APPELER
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 text-white font-bold py-4 rounded-2xl transition-all duration-100 shadow-[0_4px_0_0_#991b1b] active:shadow-[0_1px_0_0_#991b1b] active:translate-y-[2px]"
              >
                EFFACER
              </button>
            </div>
          </div>
        )}
        
        {/* Home Indicator */}
        <div className="py-3 flex justify-center">
          <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}