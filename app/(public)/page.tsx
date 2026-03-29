"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Shield, Play, Smartphone } from "lucide-react";

export default function PublicHomePage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // ✅ Enregistrement du service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    // ✅ Gestion bouton install PWA
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <main className="min-h-screen bg-white pt-24">
      <section className="relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-green-100 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-100 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border mb-6 shadow-sm">
            <Shield size={16} className="text-green-600" />
            <span className="text-sm text-gray-600">Plateforme certifiée</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-sm font-semibold text-blue-900">Alɔdó</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-blue-900 leading-tight mb-6">
            L'inclusion financière
            <br />
            <span className="bg-gradient-to-r from-green-600 via-yellow-400 to-red-600 bg-clip-text text-transparent">
              pour l'économie informelle
            </span>
          </h1>

          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
            La première plateforme SaaS qui connecte les MPME, agents terrain et institutions financières pour structurer l’économie informelle.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/langue" className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition">
              Commencer
              <ArrowRight size={18} />
            </Link>

            <button className="flex items-center gap-2 px-6 py-3 border-2 border-blue-900 text-blue-900 rounded-lg font-semibold hover:bg-blue-50 transition">
              <Play size={18} />
              Démo
            </button>

            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                <Smartphone size={18} />
                Installer
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}