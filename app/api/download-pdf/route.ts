import { getUserUuid } from "@/services/user";
import { getOrdersByUserUuid } from "@/models/order";
import { respData, respErr } from "@/lib/resp";
import { getAllPDFDownloads, findPDFDownloadByUuid, findPDFDownloadById } from "@/models/pdf";

// 定义产品ID常量
const PRODUCT_IDS = {
  PDF_BUNDLE: "pdf_bundle",
  PREMIUM: "premium",
};

// GET: 获取所有可用的 PDF 列表
export async function GET() {
  try {
    const pdfs = await getAllPDFDownloads();
    return respData(pdfs);
  } catch (e: any) {
    console.log("get pdfs failed: ", e);
    return respErr("get pdfs failed: " + e.message);
  }
}

// POST: 下载指定的 PDF
export async function POST(req: Request) {
  try {
    const { pdf_uuid, pdf_id } = await req.json();

    if (!pdf_uuid && !pdf_id) {
      return respErr("pdf_uuid or pdf_id is required");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    // 检查用户是否有权限下载PDF
    const orders = await getOrdersByUserUuid(user_uuid);
    if (!orders || orders.length === 0) {
      return respErr("no access, please purchase first");
    }

    // 检查用户是否购买了PDF相关的产品
    const hasAccess = orders.some((order) => {
      const productId = order.product_id;
      return (
        productId === PRODUCT_IDS.PDF_BUNDLE ||
        productId === PRODUCT_IDS.PREMIUM
      );
    });

    if (!hasAccess) {
      return respErr("no access, please purchase PDF bundle or premium package");
    }

    // 查找 PDF
    let pdf = null;
    if (pdf_uuid) {
      pdf = await findPDFDownloadByUuid(pdf_uuid);
    } else if (pdf_id) {
      pdf = await findPDFDownloadById(Number(pdf_id));
    }

    if (!pdf) {
      return respErr("pdf not found");
    }

    // 确保 file_url 是完整的 URL 或正确的路径
    let fileUrl = pdf.file_url;
    if (fileUrl && !fileUrl.startsWith("http") && !fileUrl.startsWith("/")) {
      fileUrl = "/" + fileUrl;
    }

    return respData({
      pdf_url: fileUrl,
      download_url: fileUrl,
      file_name: pdf.file_name,
    });
  } catch (e: any) {
    console.log("download pdf failed: ", e);
    return respErr("download pdf failed: " + e.message);
  }
}
