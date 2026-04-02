-- Insert default document templates
INSERT INTO document_templates (user_id, name, type, html_template, variables)
VALUES 
  (
    NULL,
    'Devis Standard',
    'devis',
    '<div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px;">
        <div>
          <h1 style="margin: 0; color: #1a3c6b; font-size: 24px;">DEVIS</h1>
          <p style="color: #666; margin: 5px 0;">Numéro: {{numero}}</p>
          <p style="color: #666; margin: 5px 0;">Date: {{date}}</p>
          <p style="color: #666; margin: 5px 0;">Validité: {{validite}}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 5px 0; font-weight: bold;">{{entreprise_nom}}</p>
          <p style="margin: 5px 0; color: #666;">{{entreprise_email}}</p>
          <p style="margin: 5px 0; color: #666;">{{entreprise_tel}}</p>
        </div>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #1a3c6b;">Client</h3>
        <p style="margin: 5px 0; font-weight: bold;">{{client_nom}}</p>
        <p style="margin: 5px 0;">{{client_email}}</p>
        <p style="margin: 5px 0;">{{client_tel}}</p>
        <p style="margin: 5px 0;">{{client_ifu}}</p>
        <p style="margin: 5px 0;">{{client_adresse}}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
            <th style="padding: 12px; text-align: left;">Description</th>
            <th style="padding: 12px; text-align: center;">Quantité</th>
            <th style="padding: 12px; text-align: right;">Prix unitaire</th>
            <th style="padding: 12px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{items}}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span>Sous-total HT:</span>
            <span>{{soustotal}} FCFA</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span>TVA {{tva}}%:</span>
            <span>{{tva_montant}} FCFA</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; color: #1a3c6b; font-size: 16px;">
            <span>Total TTC:</span>
            <span>{{total}} FCFA</span>
          </div>
        </div>
      </div>

      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #1a3c6b;">
        <p style="margin: 0; color: #666; font-size: 12px;">{{notes}}</p>
      </div>
    </div>',
    '{numero,date,validite,entreprise_nom,entreprise_email,entreprise_tel,client_nom,client_email,client_tel,client_ifu,client_adresse,soustotal,tva,tva_montant,total,notes,items}'
  ),
  (
    NULL,
    'Facture Standard',
    'facture',
    '<div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px;">
        <div>
          <h1 style="margin: 0; color: #1a3c6b; font-size: 24px;">FACTURE</h1>
          <p style="color: #666; margin: 5px 0;">N°: {{invoice_number}}</p>
          <p style="color: #666; margin: 5px 0;">Date: {{date_emission}}</p>
          <p style="color: #666; margin: 5px 0;">Échéance: {{date_echeance}}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 5px 0; font-weight: bold;">{{entreprise_nom}}</p>
          <p style="margin: 5px 0; color: #666;">IFU: {{entreprise_ifu}}</p>
          <p style="margin: 5px 0; color: #666;">{{entreprise_email}}</p>
          <p style="margin: 5px 0; color: #666;">{{entreprise_tel}}</p>
        </div>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #1a3c6b;">Facturé à</h3>
        <p style="margin: 5px 0; font-weight: bold;">{{client_nom}}</p>
        <p style="margin: 5px 0;">{{client_email}}</p>
        <p style="margin: 5px 0;">{{client_tel}}</p>
        <p style="margin: 5px 0;">IFU: {{client_ifu}}</p>
        <p style="margin: 5px 0;">{{client_adresse}}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
            <th style="padding: 12px; text-align: left;">Description</th>
            <th style="padding: 12px; text-align: center;">Quantité</th>
            <th style="padding: 12px; text-align: right;">Prix unitaire</th>
            <th style="padding: 12px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{items}}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span>Sous-total HT:</span>
            <span>{{subtotal_ht}} FCFA</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span>TVA {{tva_taux}}%:</span>
            <span>{{tva_montant}} FCFA</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; color: #1a3c6b; font-size: 18px;">
            <span>Total TTC:</span>
            <span>{{total_ttc}} FCFA</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; color: #008751; font-size: 16px;">
            <span>Reste dû:</span>
            <span>{{reste}} FCFA</span>
          </div>
        </div>
      </div>

      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #1a3c6b;">
        <p style="margin: 0; color: #666; font-size: 12px;">{{notes}}</p>
      </div>
    </div>',
    '{invoice_number,date_emission,date_echeance,entreprise_nom,entreprise_ifu,entreprise_email,entreprise_tel,client_nom,client_email,client_tel,client_ifu,client_adresse,subtotal_ht,tva_taux,tva_montant,total_ttc,reste,notes,items}'
  ),
  (
    NULL,
    'Contrat Standard',
    'contrat',
    '<div style="font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto;">
      <div style="border: 2px solid #1a3c6b; padding: 20px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #1a3c6b;">CONTRAT DE SERVICES</h1>
        <p style="margin: 5px 0; color: #666;">N°: {{contract_number}}</p>
        <p style="margin: 5px 0; color: #666;">Date: {{date}}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1a3c6b; margin-top: 30px;">1. PARTIES CONTRACTANTES</h3>
        <p><strong>Prestataire:</strong></p>
        <p>{{entreprise_nom}}</p>
        <p>{{entreprise_adresse}}</p>
        <p>Email: {{entreprise_email}}</p>
        <p>Téléphone: {{entreprise_tel}}</p>

        <p style="margin-top: 15px;"><strong>Client:</strong></p>
        <p>{{client_nom}}</p>
        <p>{{client_adresse}}</p>
        <p>Email: {{client_email}}</p>
        <p>Téléphone: {{client_tel}}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1a3c6b;">2. OBJET DU CONTRAT</h3>
        <p>{{objet_contrat}}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1a3c6b;">3. DURÉE</h3>
        <p>Début: {{date_debut}}</p>
        <p>Fin: {{date_fin}}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1a3c6b;">4. RÉMUNÉRATION</h3>
        <p>Montant: {{montant}} FCFA</p>
        <p>Modalités de paiement: {{modalites_paiement}}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1a3c6b;">5. CONDITIONS GÉNÉRALES</h3>
        <p>{{conditions}}</p>
      </div>

      <div style="margin-top: 50px; border-top: 2px solid #e5e7eb; padding-top: 20px;">
        <div style="display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <p style="margin: 0;">Signature Prestataire</p>
            <p style="margin: 30px 0 0 0; height: 60px;"></p>
            <p style="margin: 0;">{{entreprise_nom}}</p>
          </div>
          <div style="text-align: center;">
            <p style="margin: 0;">Signature Client</p>
            <p style="margin: 30px 0 0 0; height: 60px;"></p>
            <p style="margin: 0;">{{client_nom}}</p>
          </div>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">Fait à le {{date}}</p>
      </div>
    </div>',
    '{contract_number,date,entreprise_nom,entreprise_adresse,entreprise_email,entreprise_tel,client_nom,client_adresse,client_email,client_tel,objet_contrat,date_debut,date_fin,montant,modalites_paiement,conditions}'
  )
ON CONFLICT DO NOTHING;
