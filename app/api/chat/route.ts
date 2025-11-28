import { getUserUuid } from "@/services/user";
import { getOrdersByUserUuid } from "@/models/order";
import { respData, respErr } from "@/lib/resp";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// 定义产品ID常量
const PRODUCT_IDS = {
  CHATBOT_ACCESS: "chatbot_access",
  PREMIUM: "premium",
};

// 检查用户是否有聊天机器人访问权限
async function checkChatbotAccess(user_uuid: string): Promise<{
  hasAccess: boolean;
}> {
  const orders = await getOrdersByUserUuid(user_uuid);
  if (!orders || orders.length === 0) {
    return { hasAccess: false };
  }

  // 检查用户是否购买了聊天机器人相关的产品
  const hasAccess = orders.some((order) => {
    const productId = order.product_id;
    return (
      productId === PRODUCT_IDS.CHATBOT_ACCESS ||
      productId === PRODUCT_IDS.PREMIUM
    );
  });

  return { hasAccess };
}

// GET: 检查用户访问状态
export async function GET() {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respData({ accessStatus: "not_logged_in" });
    }

    const { hasAccess } = await checkChatbotAccess(user_uuid);
    
    if (hasAccess) {
      return respData({ accessStatus: "has_access" });
    } else {
      return respData({ accessStatus: "purchase_required" });
    }
  } catch (e: any) {
    console.log("check chatbot access failed: ", e);
    return respErr("check chatbot access failed: " + e.message);
  }
}

// POST: 处理聊天请求
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return respErr("invalid messages");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    // 检查用户是否有权限使用聊天机器人
    const { hasAccess } = await checkChatbotAccess(user_uuid);
    
    if (!hasAccess) {
      return respErr("purchase_required");
    }

    // 检查环境变量
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not set");
      return respErr("chatbot service is not configured");
    }

    // 创建 OpenRouter 客户端
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_WEB_URL || "https://travelkang.com",
        "X-Title": "TravelKang - China Travel Assistant",
      },
    });

    // 使用AI SDK创建流式响应
    const result = streamText({
      model: openrouter("qwen/qwen3-30b-a3b"),
      system: `你是一位专业的中国旅游规划大师，专门为来中国旅游的海外游客提供帮助。

你的职责是：
- 提供准确、实用的中国旅游建议和信息
- 回答关于中国旅游的各种问题，包括：
  * 旅游规划和行程安排
  * 文化礼仪和习俗
  * 交通方式（火车、飞机、出租车等）
  * 住宿推荐
  * 美食和餐饮
  * 旅游景点和活动
  * 支付方式（支付宝、微信支付、现金）
  * 语言提示和常用短语
  * 安全和紧急信息
  * 签证和证件要求
- 只回答与中国旅游相关的问题
- 如果问题与中国旅游无关，礼貌地引导用户回到中国旅游相关的话题
- 使用 Markdown 格式回复，使内容更易读
- 始终以友好、清晰、简洁的方式回应

请用中文回复，除非用户明确要求使用其他语言。`,
      messages: messages,
    });

    return result.toDataStreamResponse();
  } catch (e: any) {
    console.log("chat failed: ", e);
    return respErr("chat failed: " + e.message);
  }
}
