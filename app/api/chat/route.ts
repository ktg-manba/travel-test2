import { getUserUuid } from "@/services/user";
import { getOrdersByUserUuid } from "@/models/order";
import { respErr } from "@/lib/resp";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// 定义产品ID常量
const PRODUCT_IDS = {
  CHATBOT_ACCESS: "chatbot_access",
  COMPLETE_PACKAGE: "complete-package",
  ESSENTIAL_GUIDE: "essential-guide",
  PREMIUM: "premium",
};

// 检查用户聊天机器人访问权限
// 返回: { hasAccess: boolean, hasEssentialGuide: boolean, hasCompletePackage: boolean }
async function checkChatbotAccess(user_uuid: string): Promise<{
  hasAccess: boolean;
  hasEssentialGuide: boolean;
  hasCompletePackage: boolean;
  hasChatbotAccess: boolean;
}> {
  const orders = await getOrdersByUserUuid(user_uuid);
  if (!orders || orders.length === 0) {
    return {
      hasAccess: false,
      hasEssentialGuide: false,
      hasCompletePackage: false,
      hasChatbotAccess: false,
    };
  }

  // 检查是否有 chatbot_access
  const hasChatbotAccess = orders.some(
    (order) =>
      order.status === "paid" &&
      order.product_id === PRODUCT_IDS.CHATBOT_ACCESS
  );

  // 检查是否有 complete-package
  const hasCompletePackage = orders.some(
    (order) =>
      order.status === "paid" &&
      order.product_id === PRODUCT_IDS.COMPLETE_PACKAGE
  );

  // 检查是否有 premium（premium 通常包含所有功能）
  const hasPremium = orders.some(
    (order) =>
      order.status === "paid" &&
      order.product_id === PRODUCT_IDS.PREMIUM
  );

  // 检查是否有 essential-guide
  const hasEssentialGuide = orders.some(
    (order) =>
      order.status === "paid" &&
      order.product_id === PRODUCT_IDS.ESSENTIAL_GUIDE
  );

  // 有 chatbot_access、complete-package 或 premium 都可以使用聊天功能
  const hasAccess = hasChatbotAccess || hasCompletePackage || hasPremium;

  return {
    hasAccess,
    hasEssentialGuide,
    hasCompletePackage,
    hasChatbotAccess,
  };
}

// 创建 OpenRouter provider
function getOpenRouterProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  return createOpenRouter({
    apiKey: apiKey,
  });
}

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

    // 检查用户权限
    const accessCheck = await checkChatbotAccess(user_uuid);
    
    if (!accessCheck.hasAccess) {
      // 如果没有 complete-package，返回错误信息
      if (accessCheck.hasEssentialGuide) {
        return respErr("upgrade_required");
      } else {
        return respErr("purchase_required");
      }
    }

    // 创建 OpenRouter provider
    const openrouter = getOpenRouterProvider();

    // 使用 AI SDK 创建流式响应
    const result = streamText({
      model: openrouter("qwen/qwen3-30b-a3b"),
      system: `你是一位中国旅游规划大师，专门为海外来中国旅游的游客提供帮助。你的职责是：

1. **只回答关于中国旅游的相关问题**，包括：
   - 旅游规划和行程安排
   - 文化礼仪和习俗
   - 交通方式（火车、飞机、出租车等）
   - 住宿推荐
   - 美食和餐厅
   - 旅游景点和活动
   - 支付方式（支付宝、微信支付、现金）
   - 语言提示和常用短语
   - 安全和紧急信息
   - 签证和文件要求
   - 城市旅游攻略
   - 购物和娱乐

2. **如果用户问的问题与中国旅游无关**，请礼貌地提醒用户你只回答关于中国旅游的问题。

3. **回答要准确、实用、友好**，使用清晰简洁的语言。

4. **如果不知道某些信息**，诚实承认并建议用户在哪里可以找到相关信息。

5. **使用 Markdown 格式**来格式化你的回答，使内容更易读。

请始终以友好和专业的方式回应，帮助海外游客更好地规划他们的中国之旅。`,
      messages: messages,
    });

    return result.toDataStreamResponse();
  } catch (e: any) {
    console.log("chat failed: ", e);
    return respErr("chat failed: " + e.message);
  }
}

// GET 方法：检查用户权限状态
export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return Response.json({
        code: 1,
        message: "no auth",
        data: {
          hasAccess: false,
          hasEssentialGuide: false,
          hasCompletePackage: false,
          hasChatbotAccess: false,
        },
      });
    }

    const accessCheck = await checkChatbotAccess(user_uuid);
    return Response.json({
      code: 0,
      message: "ok",
      data: accessCheck,
    });
  } catch (e: any) {
    console.log("check access failed: ", e);
    return Response.json({
      code: 1,
      message: "check access failed: " + e.message,
      data: {
        hasAccess: false,
        hasEssentialGuide: false,
        hasCompletePackage: false,
      },
    });
  }
}


