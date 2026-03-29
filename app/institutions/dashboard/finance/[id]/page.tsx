"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  gray50: "#F9FAFB",
  gray600: "#4B5563",
};

export default function FinanceDetailPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: colors.gray50, padding: "24px" }}>
      <button
        onClick={() => router.back()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          color: colors.gray600,
          cursor: "pointer",
          padding: "8px 0",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <ArrowLeft size={20} />
        Retour
      </button>

      <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 32, textAlign: "center" }}>
        <p style={{ fontSize: 16, color: colors.gray600 }}>Détail du financement</p>
        <p style={{ fontSize: 14, color: colors.gray600, marginTop: 8 }}>
          Cette page n'est pas encore complétée. Retournez au tableau de bord pour gérer les applications.
        </p>
      </div>
    </div>
  );
}
