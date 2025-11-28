"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PDFDownload {
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

export default function PDFGuidesPage() {
  const t = useTranslations();
  const { user, setShowSignModal } = useAppContext();
  const [pdfs, setPdfs] = useState<PDFDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PDFDownload | null>(null);

  // 获取 PDF 列表
  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const response = await fetch("/api/download-pdf");
        const { code, data } = await response.json();
        
        if (code === 0 && data) {
          setPdfs(data);
        }
      } catch (e) {
        console.error("Failed to fetch PDFs:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, []);

  const handlePreview = (pdf: PDFDownload) => {
    setPreviewPdf(pdf);
  };

  const handleDownload = async (pdf: PDFDownload) => {
    if (!user) {
      setShowSignModal(true);
      return;
    }

    try {
      setDownloading(pdf.uuid || pdf.id?.toString() || "");
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdf_uuid: pdf.uuid,
          pdf_id: pdf.id,
        }),
      });

      const { code, message, data } = await response.json();

      if (code !== 0) {
        toast.error(message || t("travel.pdf_guides.error"));
        return;
      }

      // 创建下载链接
      const link = document.createElement("a");
      link.href = data.download_url || data.pdf_url;
      link.download = data.file_name || pdf.file_name || "download.pdf";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t("travel.pdf_guides.download_success"));
    } catch (e) {
      console.error("Download failed:", e);
      toast.error(t("travel.pdf_guides.error"));
    } finally {
      setDownloading(null);
    }
  };

  // 处理图片路径
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    // 如果 URL 以 public/ 开头，去掉它
    if (url.startsWith("public/")) {
      return "/" + url.substring(7);
    }
    // 如果 URL 不以 / 或 http 开头，添加 /
    if (!url.startsWith("/") && !url.startsWith("http")) {
      return "/" + url;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("travel.pdf_guides.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("travel.pdf_guides.description")}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("travel.pdf_guides.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("travel.pdf_guides.description")}</p>
      </div>

      {pdfs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("travel.pdf_guides.no_pdfs") || "No PDFs available"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pdfs.map((pdf) => {
            const imageUrl = getImageUrl(pdf.cover_image_url);
            const pdfKey = pdf.uuid || pdf.id?.toString() || "";
            const isDownloading = downloading === pdfKey;

            return (
              <Card key={pdfKey} className="overflow-hidden">
                {imageUrl && (
                  <div className="relative w-full h-48 bg-muted cursor-pointer" onClick={() => handlePreview(pdf)}>
                    <Image
                      src={imageUrl}
                      alt={pdf.file_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <CardTitle className="line-clamp-2">{pdf.file_name}</CardTitle>
                  </div>
                  {pdf.description && (
                    <CardDescription className="line-clamp-3">
                      {pdf.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex gap-2">
                  {imageUrl && (
                    <Button
                      variant="outline"
                      onClick={() => handlePreview(pdf)}
                      className="flex-1"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {t("travel.pdf_guides.preview") || "Preview"}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDownload(pdf)}
                    disabled={isDownloading}
                    className="flex-1"
                  >
                    {isDownloading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        {t("travel.pdf_guides.downloading")}
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        {t("travel.pdf_guides.download") || "Download"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 预览对话框 */}
      <Dialog open={!!previewPdf} onOpenChange={(open) => !open && setPreviewPdf(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewPdf?.file_name}</DialogTitle>
            {previewPdf?.description && (
              <DialogDescription>{previewPdf.description}</DialogDescription>
            )}
          </DialogHeader>
          {previewPdf && getImageUrl(previewPdf.cover_image_url) && (
            <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
              <Image
                src={getImageUrl(previewPdf.cover_image_url)!}
                alt={previewPdf.file_name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewPdf(null)}>
              {t("travel.pdf_guides.close") || "Close"}
            </Button>
            {previewPdf && (
              <Button onClick={() => handleDownload(previewPdf)}>
                <Download className="mr-2 h-4 w-4" />
                {t("travel.pdf_guides.download") || "Download"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
