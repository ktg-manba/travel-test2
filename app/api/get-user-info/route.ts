import { respData, respErr, respJson } from "@/lib/resp";

import { findUserByEmail } from "@/models/user";
import { getUserCredits } from "@/services/credit";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    console.log("get-user-info session:", { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      email: session?.user?.email 
    });

    if (!session || !session.user || !session.user.email) {
      console.log("No session or email in session");
      return respJson(-2, "no auth");
    }

    console.log("Looking up user by email:", session.user.email);
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      console.log("User not found in database for email:", session.user.email);
      return respErr("user not exist");
    }

    console.log("User found:", { uuid: user.uuid, email: user.email });
    user.credits = await getUserCredits(user.uuid);

    return respData(user);
  } catch (e) {
    console.error("get user info failed: ", e);
    return respErr("get user info failed: " + (e instanceof Error ? e.message : String(e)));
  }
}
