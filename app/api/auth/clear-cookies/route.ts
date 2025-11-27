import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const response = NextResponse.json({ success: true });

  // Clear all Supabase-related cookies
  const supabaseCookies = [
    "sb-access-token",
    "sb-refresh-token",
    "sb-auth-token",
    "supabase.auth.token",
    "sb-localhost-auth-token",
  ];

  supabaseCookies.forEach((cookieName) => {
    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      path: "/",
      domain: "localhost",
    });
    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      path: "/",
    });
  });

  return response;
}

