import { createClient } from "@supabase/supabase-js";
import { respData, respErr } from "@/lib/resp";
import { findUserByEmail, insertUser } from "@/models/user";
import { User } from "@/types/user";
import { getUuid } from "@/lib/hash";
import { getIsoTimestr } from "@/lib/time";
import { getClientIp } from "@/lib/ip";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return respErr("Email and password are required");
    }

    if (password.length < 6) {
      return respErr("Password must be at least 6 characters");
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return respErr("User already exists");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return respErr("Supabase config missing");
    }

    // Create client without cookie persistence to avoid 431 error
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return respErr(authError.message);
    }

    if (!authData.user) {
      return respErr("Failed to create user");
    }

    // Save user to database
    const dbUser: User = {
      uuid: getUuid(),
      email: authData.user.email!,
      nickname: authData.user.user_metadata?.name || "",
      avatar_url: authData.user.user_metadata?.avatar_url || "",
      signin_type: "email",
      signin_provider: "email",
      signin_openid: authData.user.id,
      created_at: getIsoTimestr(),
      signin_ip: await getClientIp(),
    };

    try {
      await insertUser(dbUser);
    } catch (e) {
      console.error("Failed to save user to database:", e);
      // User is created in Supabase Auth but not in our DB
      // This is okay, we can handle it later
    }

    return respData({
      user: authData.user,
      message: "Sign up successful. Please check your email to verify your account.",
    });
  } catch (e: any) {
    console.log("signup failed: ", e);
    return respErr("signup failed: " + e.message);
  }
}

