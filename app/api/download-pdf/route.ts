import { getUserUuid } from "@/services/user";
import { getOrdersByUserUuid } from "@/models/order";
import { findPDFDownloadByUuid, getAllPDFDownloads } from "@/models/pdf";
import { respData, respErr } from "@/lib/resp";

// 定义产品ID常量
const PRODUCT_IDS = {
  PDF_BUNDLE: "pdf_bundle",
  PREMIUM: "premium",
  PAYMENT_GUIDE: "payment_guide",
  CITY_GUIDE: "city_guide",
};

// 获取所有PDF列表（不需要登录）
export async function GET(req: Request) {
  try {
    const pdfs = await getAllPDFDownloads();
    return respData({ pdfs });
  } catch (e: any) {
    console.log("get pdfs failed: ", e);
    return respErr("get pdfs failed: " + e.message);
  }
}

// 下载PDF（需要登录和购买权限）
export async function POST(req: Request) {
  try {
    const { pdf_uuid } = await req.json();

    if (!pdf_uuid) {
      return respErr("pdf_uuid is required");
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

    // 从数据库获取PDF信息 - 支持通过uuid或id查询
    let pdf = await findPDFDownloadByUuid(pdf_uuid);
    
    // 如果通过uuid找不到，尝试通过id查找
    if (!pdf && !isNaN(Number(pdf_uuid))) {
      const allPdfs = await getAllPDFDownloads();
      pdf = allPdfs.find(p => p.id?.toString() === pdf_uuid);
    }
    
    if (!pdf) {
      return respErr("PDF not found");
    }

    return respData({
      pdf_url: pdf.file_url,
      download_url: pdf.file_url,
      file_name: pdf.file_name,
    });
  } catch (e: any) {
    console.log("download pdf failed: ", e);
    return respErr("download pdf failed: " + e.message);
  }
}


