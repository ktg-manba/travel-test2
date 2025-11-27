import { getUserUuid } from "@/services/user";
import { getOrdersByUserUuid } from "@/models/order";
import { respData, respErr } from "@/lib/resp";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

// 定义产品ID常量
const PRODUCT_IDS = {
  CHATBOT_ACCESS: "chatbot_access",
  PREMIUM: "premium",
};

// 检查用户是否有聊天机器人访问权限
async function checkChatbotAccess(user_uuid: string): Promise<boolean> {
  const orders = await getOrdersByUserUuid(user_uuid);
  if (!orders || orders.length === 0) {
    return false;
  }

  // 检查用户是否购买了聊天机器人相关的产品
  return orders.some((order) => {
    const productId = order.product_id;
    return (
      productId === PRODUCT_IDS.CHATBOT_ACCESS ||
      productId === PRODUCT_IDS.PREMIUM
    );
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

    // 检查用户是否有权限使用聊天机器人
    const hasAccess = await checkChatbotAccess(user_uuid);
    if (!hasAccess) {
      return respErr("no access, please purchase chatbot access or premium package");
    }

    // 使用AI SDK创建流式响应
    const result = streamText({
      model: openai("gpt-4o-mini"), // 可以根据需要更换模型
      system: `You are a helpful travel assistant for international travelers visiting China. 
      You provide accurate, practical, and friendly advice about:
      - Travel planning and itineraries
      - Cultural etiquette and customs
      - Transportation (trains, flights, taxis, etc.)
      - Accommodation recommendations
      - Food and dining
      - Tourist attractions and activities
      - Payment methods (Alipay, WeChat Pay, cash)
      - Language tips and useful phrases
      - Safety and emergency information
      - Visa and documentation requirements
      
      Always respond in a helpful, clear, and concise manner. If you don't know something, admit it and suggest where they might find the information.`,
      messages: messages,
    });

    return result.toDataStreamResponse();
  } catch (e: any) {
    console.log("chat failed: ", e);
    return respErr("chat failed: " + e.message);
  }
}


