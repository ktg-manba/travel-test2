import { getSupabaseClient } from "./db";

export interface PDFDownload {
  id?: number;
  uuid?: string;
  file_name: string;
  file_url: string;
  description?: string;
  cover_image_url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  sort_order?: number;
}

export async function getAllPDFDownloads(): Promise<PDFDownload[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pdf_downloads")
    .select("*")
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching PDF downloads:", error);
    return [];
  }

  return data || [];
}

export async function findPDFDownloadByUuid(
  uuid: string
): Promise<PDFDownload | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pdf_downloads")
    .select("*")
    .eq("uuid", uuid)
    .eq("status", "active")
    .limit(1)
    .single();

  if (error) {
    console.error("Error finding PDF download by uuid:", error);
    return undefined;
  }

  return data;
}

export async function findPDFDownloadById(
  id: number
): Promise<PDFDownload | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pdf_downloads")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .limit(1)
    .single();

  if (error) {
    console.error("Error finding PDF download by id:", error);
    return undefined;
  }

  return data;
}

