export interface PDFDownload {
  id?: number;
  uuid?: string;
  file_name: string;
  file_url: string;
  description: string;
  cover_image_url: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  sort_order?: number;
}

