import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { findUserByEmail } from "@/models/user";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return respData({ user: null });
    }

    // Get user from database
    const dbUser = await findUserByEmail(session.user.email);

    if (!dbUser) {
      return respData({ user: null });
    }

    return respData({
      user: {
        uuid: dbUser.uuid,
        email: dbUser.email,
        nickname: dbUser.nickname,
        avatar_url: dbUser.avatar_url,
        created_at: dbUser.created_at,
      },
    });
  } catch (e: any) {
    console.log("get session failed: ", e);
    return respErr("get session failed: " + e.message);
  }
}

