"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";

export default function PDFGuidesPage() {
  const t = useTranslations();
  const { user, setShowSignModal } = useAppContext();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (pdfType: "payment_guide" | "city_guide") => {
    if (!user) {
      setShowSignModal(true);
      return;
    }

    try {
      setDownloading(pdfType);
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pdf_type: pdfType }),
      });

      const { code, message, data } = await response.json();

      if (code !== 0) {
        toast.error(message || t("travel.pdf_guides.error"));
        return;
      }

      // 创建下载链接
      const link = document.createElement("a");
      link.href = data.download_url || data.pdf_url;
      link.download = pdfType === "payment_guide" ? "payment-guide.pdf" : "city-guide.pdf";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("travel.pdf_guides.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("travel.pdf_guides.description")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>{t("travel.pdf_guides.payment_guide.title")}</CardTitle>
            </div>
            <CardDescription>
              {t("travel.pdf_guides.payment_guide.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleDownload("payment_guide")}
              disabled={downloading !== null}
              className="w-full"
            >
              {downloading === "payment_guide" ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {t("travel.pdf_guides.downloading")}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t("travel.pdf_guides.payment_guide.download")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>{t("travel.pdf_guides.city_guide.title")}</CardTitle>
            </div>
            <CardDescription>
              {t("travel.pdf_guides.city_guide.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleDownload("city_guide")}
              disabled={downloading !== null}
              className="w-full"
            >
              {downloading === "city_guide" ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {t("travel.pdf_guides.downloading")}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t("travel.pdf_guides.city_guide.download")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


