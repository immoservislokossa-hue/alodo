// Types pour les transactions et projets

export type TransactionType = 'income' | 'expense';
export type ProjectStatus = 'draft' | 'ongoing' | 'completed' | 'cancelled';
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid';
export type DocumentType = 'devis' | 'facture' | 'contrat';

export interface Project {
  id: string;
  user_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  status: ProjectStatus;
  budget: number | null;
  total_income: number | null;
  total_expense: number | null;
  margin: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

export interface ServiceTransaction {
  id: string;
  user_id: string | null;
  type: TransactionType;
  amount: number;
  project_id: string | null;
  category: string | null;
  notes: Record<string, any> | null;
  date: string | null;
  created_at: string | null;
  projects?: Project;
}

export interface Client {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: Record<string, any> | null;
  created_at: string | null;
}

export interface DocumentTemplate {
  id: string;
  user_id: string | null;
  name: string;
  type: DocumentType;
  html_template: string;
  variables: string[] | null;
  created_at: string | null;
}

export interface Document {
  id: string;
  user_id: string | null;
  type: DocumentType;
  project_id: string | null;
  client_id: string | null;
  template_id: string | null;
  status: DocumentStatus;
  data: Record<string, any>;
  file_url: string | null;
  created_at: string | null;
}

export type TransactionCategory = 
  | 'Prestation de service'
  | 'Vente de matériel'
  | 'Honoraires'
  | 'Remboursement'
  | 'Autre revenu'
  | 'Matériel et équipement'
  | 'Transport'
  | 'Main d\'œuvre'
  | 'Location'
  | 'Services publics'
  | 'Communication'
  | 'Marketing'
  | 'Impôts et taxes'
  | 'Assurance'
  | 'Autre dépense';
