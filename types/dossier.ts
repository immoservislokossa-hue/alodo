export interface PieceIdentite {
  type?: string;
  numero?: string;
  date_delivrance?: string;
  lieu_delivrance?: string;
  pays_delivrance?: string;
}

export interface Promoteur {
  prenom?: string;
  nom?: string;
  sexe?: string;
  date_naissance?: string;
  nationalite?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  piece_identite?: PieceIdentite;
}

export interface Activite {
  principale?: string;
  secondaire?: string;
  description?: string;
  secteur?: string;
}

export interface Etablissement {
  nom_commercial?: string;
  denomination_sociale?: string;
  adresse?: string;
  commune?: string;
  arrondissement?: string;
  quartier?: string;
  activite?: Activite;
}

export interface DossierDocument {
  type?: string;
  nom?: string;
  url?: string;
  mime_type?: string;
  statut?: string;
}

export interface DossierJSON {
  etablissement?: Etablissement;
  promoteur?: Promoteur;
  activite_principale?: string;
  nom_commercial?: string;
  chiffre_affaires_annuel_fcfa?: number | string;
  nombre_employes?: number | string;
  autorise_publication_annuaire?: boolean | string;
  telephone?: string;
  email?: string;
  adresse?: string;
  commune?: string;
  statut?: string;
  source?: string;
  documents?: DossierDocument[];
  note?: string;
  remarques?: string;
  raw_text?: string;
  [key: string]: unknown;
}
