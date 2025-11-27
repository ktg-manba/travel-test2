import { getUserUuid } from "@/services/user";
import { getOrdersByUserUuid } from "@/models/order";
import { respData, respErr } from "@/lib/resp";

// 定义产品ID常量
const PRODUCT_IDS = {
  PDF_BUNDLE: "pdf_bundle",
  PREMIUM: "premium",
  PAYMENT_GUIDE: "payment_guide",
  CITY_GUIDE: "city_guide",
};

export async function POST(req: Request) {
  try {
    const { pdf_type } = await req.json(); // pdf_type: "payment_guide" | "city_guide"

    if (!pdf_type || !["payment_guide", "city_guide"].includes(pdf_type)) {
      return respErr("invalid pdf_type");
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
        productId === PRODUCT_IDS.PREMIUM ||
        (pdf_type === "payment_guide" && productId === PRODUCT_IDS.PAYMENT_GUIDE) ||
        (pdf_type === "city_guide" && productId === PRODUCT_IDS.CITY_GUIDE)
      );
    });

    if (!hasAccess) {
      return respErr("no access, please purchase PDF bundle or premium package");
    }

    // 这里应该返回PDF文件的URL或直接返回文件
    // 实际实现中，PDF文件应该存储在云存储中（如S3、Supabase Storage等）
    // 这里返回一个示例URL，实际使用时需要替换为真实的PDF文件路径
    const pdfUrls: Record<string, string> = {
      payment_guide: "/pdfs/payment-guide.pdf", // 需要替换为实际PDF路径
      city_guide: "/pdfs/city-guide.pdf", // 需要替换为实际PDF路径
    };

    return respData({
      pdf_url: pdfUrls[pdf_type],
      download_url: pdfUrls[pdf_type],
    });
  } catch (e: any) {
    console.log("download pdf failed: ", e);
    return respErr("download pdf failed: " + e.message);
  }
}


