"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader, Eye } from "lucide-react";
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
import { PDFDownload } from "@/types/pdf";

export default function PDFGuidesPage() {
  const t = useTranslations();
  const { user, setShowSignModal } = useAppContext();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [pdfs, setPdfs] = useState<PDFDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPdf, setPreviewPdf] = useState<PDFDownload | null>(null);

  // 获取PDF列表
  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const response = await fetch("/api/download-pdf", {
          method: "GET",
        });

        const { code, data } = await response.json();
        if (code === 0 && data?.pdfs) {
          // 处理图片路径，去掉 public/ 前缀
          const processedPdfs = data.pdfs.map((pdf: PDFDownload) => ({
            ...pdf,
            cover_image_url: pdf.cover_image_url?.replace(/^public\//, '/') || pdf.cover_image_url,
          }));
          setPdfs(processedPdfs);
        }
      } catch (e) {
        console.error("Failed to fetch PDFs:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, []);

  const handleDownload = async (pdf: PDFDownload) => {
    if (!user) {
      setShowSignModal(true);
      return;
    }

    const pdfUuid = pdf.uuid || pdf.id?.toString();
    if (!pdfUuid) {
      toast.error("PDF identifier is missing");
      return;
    }

    try {
      setDownloading(pdfUuid);
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pdf_uuid: pdfUuid }),
      });

      const { code, message, data } = await response.json();

      if (code !== 0) {
        toast.error(message || t("travel.pdf_guides.error"));
        return;
      }

      // 创建下载链接
      const link = document.createElement("a");
      link.href = data.download_url || data.pdf_url;
      link.download = data.file_name || pdf.file_name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t("travel.pdf_guides.download_success"));
    } catch (e) {
      console.log("download failed: ", e);
      toast.error(t("travel.pdf_guides.error"));
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = (pdf: PDFDownload) => {
    setPreviewPdf(pdf);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin" />
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
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t("travel.pdf_guides.no_pdfs") || "No PDFs available"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {pdfs.map((pdf) => (
            <Card key={pdf.uuid || pdf.id} className="overflow-hidden">
              <div className="relative h-48 w-full bg-muted">
                {pdf.cover_image_url ? (
                  <Image
                    src={pdf.cover_image_url.replace(/^public\//, '/')}
                    alt={pdf.file_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePreview(pdf)}
                    className="backdrop-blur-sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t("travel.pdf_guides.preview") || "Preview"}
                  </Button>
                </div>
              </div>
              <CardHeader>
                <CardTitle>{pdf.file_name}</CardTitle>
                <CardDescription>
                  {pdf.description || t("travel.pdf_guides.no_description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleDownload(pdf)}
                  disabled={downloading !== null}
                  className="w-full"
                >
                  {downloading === (pdf.uuid || pdf.id?.toString()) ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      {t("travel.pdf_guides.downloading")}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      {t("travel.pdf_guides.download")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 预览对话框 */}
      <Dialog open={!!previewPdf} onOpenChange={() => setPreviewPdf(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewPdf?.file_name}</DialogTitle>
            <DialogDescription>{previewPdf?.description}</DialogDescription>
          </DialogHeader>
          {previewPdf && (
            <div className="relative w-full h-[600px] bg-muted rounded-lg overflow-hidden">
              {previewPdf.cover_image_url ? (
                <Image
                  src={previewPdf.cover_image_url.replace(/^public\//, '/')}
                  alt={previewPdf.file_name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FileText className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPreviewPdf(null)}>
              {t("sign_modal.close_title")}
            </Button>
            {previewPdf && user && (
              <Button onClick={() => handleDownload(previewPdf)}>
                <Download className="mr-2 h-4 w-4" />
                {t("travel.pdf_guides.download")}
              </Button>
            )}
            {previewPdf && !user && (
              <Button onClick={() => setShowSignModal(true)}>
                {t("user.sign_in")} {t("travel.pdf_guides.to_download")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


