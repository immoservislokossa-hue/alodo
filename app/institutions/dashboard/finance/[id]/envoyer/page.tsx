"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft, AlertCircle, CheckCircle, Loader } from "lucide-react";

type PaymentMethod = "mtn_bj" | "moov_bj" | "orange_bj";

export default function EnvoyerCreditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    checkoutUrl: string;
    creditId: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    phoneNumber: "",
    description: "",
    method: "mtn_bj" as PaymentMethod,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        // Validate input
        if (!formData.amount || !formData.phoneNumber) {
          throw new Error("Montant et numéro de téléphone sont obligatoires");
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
          throw new Error("Le montant doit être un nombre positif");
        }

        // Call send credit API
        const response = await fetch("/api/credits/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: params.id,
            amount: Math.floor(amount),
            phoneNumber: formData.phoneNumber,
            description:
              formData.description || "Allocation de crédit via ALODO",
            method: formData.method,
            currency: "XOF",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de l'envoi");
        }

        const data = await response.json();

        // Show success with Moneroo redirect
        setSuccess({
          checkoutUrl: data.data?.checkoutUrl || "",
          creditId: data.data?.creditId || "",
        });

        // Optionally redirect to Moneroo after a delay
        setTimeout(() => {
          if (data.data?.checkoutUrl) {
            window.location.href = data.data.checkoutUrl;
          }
        }, 2000);
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    },
    [params.id]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
          <h1 className="text-3xl font-bold">Envoyer un crédit</h1>
          <p className="text-green-100 mt-2">
            Allouez une ligne de crédit à un utilisateur
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Erreur</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3 items-start">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Succès!</h3>
                <p className="text-green-700 text-sm mt-1">
                  Le crédit a été créé. Redirection vers Moneroo en cours...
                </p>
                <p className="text-green-600 text-xs mt-2">
                  ID du crédit: {success.creditId}
                </p>
                {success.checkoutUrl && (
                  <a
                    href={success.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition"
                  >
                    Accéder à Moneroo →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Montant (XOF) *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Ex: 50000"
                step="100"
                min="0"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Montant minimum recommandé: 1000 XOF
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Ex: +22961234567 ou 61234567"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Numéro de l'utilisateur pour recevoir le transfert
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-2">
                Opérateur mobile
              </label>
              <select
                id="method"
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="mtn_bj">MTN Benin</option>
                <option value="moov_bj">Moov Benin</option>
                <option value="orange_bj">Orange Benin</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ex: Financement de projet - Prêt personnel"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Description visible par l'utilisateur
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading && <Loader size={20} className="animate-spin" />}
                {loading ? "Traitement en cours..." : "Créer et envoyer le crédit"}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 text-sm">Comment ça marche?</h3>
              <ol className="text-blue-700 text-sm space-y-1 mt-2 ml-4 list-decimal">
                <li>Entrez le montant et le numéro de téléphone du bénéficiaire</li>
                <li>Cliquez sur "Créer et envoyer le crédit"</li>
                <li>Vous serez redirigé vers Moneroo pour finaliser le paiement</li>
                <li>Une fois payé, l'utilisateur recevra les fonds</li>
                <li>L'utilisateur pourra rembourser quand il le souhaite</li>
              </ol>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
