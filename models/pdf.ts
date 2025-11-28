import { PDFDownload } from "@/types/pdf";
import { getSupabaseClient } from "./db";

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

  return (data as PDFDownload[]) || [];
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
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function insertPDFDownload(
  pdf: PDFDownload
): Promise<PDFDownload | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pdf_downloads")
    .insert(pdf)
    .select()
    .single();

  if (error) {
    console.error("Error inserting PDF download:", error);
    return undefined;
  }

  return data;
}

export async function updatePDFDownload(
  uuid: string,
  pdf: Partial<PDFDownload>
): Promise<PDFDownload | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pdf_downloads")
    .update(pdf)
    .eq("uuid", uuid)
    .select()
    .single();

  if (error) {
    console.error("Error updating PDF download:", error);
    return undefined;
  }

  return data;
}

export async function deletePDFDownload(
  uuid: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("pdf_downloads")
    .delete()
    .eq("uuid", uuid);

  if (error) {
    console.error("Error deleting PDF download:", error);
    return false;
  }

  return true;
}

