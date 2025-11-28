import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthConfig } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { User } from "@/types/user";
import { getClientIp } from "@/lib/ip";
import { getIsoTimestr } from "@/lib/time";
import { getUuid } from "@/lib/hash";
import { saveUser } from "@/services/user";

let providers: Provider[] = [];

// Google One Tap Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
) {
  providers.push(
    CredentialsProvider({
      id: "google-one-tap",
      name: "google-one-tap",

      credentials: {
        credential: { type: "text" },
      },

      async authorize(credentials, req) {
        const googleClientId = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID;
        if (!googleClientId) {
          console.log("invalid google auth config");
          return null;
        }

        const token = credentials!.credential;

        const response = await fetch(
          "https://oauth2.googleapis.com/tokeninfo?id_token=" + token
        );
        if (!response.ok) {
          console.log("Failed to verify token");
          return null;
        }

        const payload = await response.json();
        if (!payload) {
          console.log("invalid payload from token");
          return null;
        }

        const {
          email,
          sub,
          given_name,
          family_name,
          email_verified,
          picture: image,
        } = payload;
        if (!email) {
          console.log("invalid email in payload");
          return null;
        }

        const user = {
          id: sub,
          name: [given_name, family_name].join(" "),
          email,
          image,
          emailVerified: email_verified ? new Date() : null,
        };

        return user;
      },
    })
  );
}

// Google Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" &&
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET
) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

// Email/Password Auth (using Supabase Auth for verification, but Next-Auth for session)
providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      console.log("=== AUTHORIZE CALLED ===", { 
        hasEmail: !!credentials?.email,
        hasPassword: !!credentials?.password 
      });
      
      if (!credentials?.email || !credentials?.password) {
        console.log("Missing credentials");
        return null;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase config missing");
        return null;
      }

      console.log("Verifying credentials with Supabase...");
      // Use Supabase Auth to verify credentials (without setting cookies)
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email as string,
        password: credentials.password as string,
      });

      console.log("Supabase auth result:", { 
        hasError: !!error, 
        error: error?.message,
        hasUser: !!data?.user,
        userEmail: data?.user?.email 
      });

      if (error || !data.user) {
        console.log("Auth failed, returning null");
        return null;
      }

      const userResult = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "",
        image: data.user.user_metadata?.avatar_url || null,
      };
      
      console.log("=== AUTHORIZE RETURNING USER ===", { 
        id: userResult.id,
        email: userResult.email,
        name: userResult.name 
      });
      
      return userResult;
    },
  })
);

// Github Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" &&
  process.env.AUTH_GITHUB_ID &&
  process.env.AUTH_GITHUB_SECRET
) {
  providers.push(
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  })
  .filter((provider) => provider.id !== "google-one-tap");

export const authOptions: NextAuthConfig = {
  providers,
  secret: process.env.AUTH_SECRET, // Required for production
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development", // Enable debug mode in development
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true;
      } else {
        // Return false to display a default error message
        return false;
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      // Add user info from token to session
      console.log("Session callback:", { 
        hasToken: !!token, 
        hasTokenUser: !!token?.user,
        tokenEmail: token?.email,
        tokenUserEmail: (token?.user as any)?.email,
        sessionEmail: session?.user?.email,
        tokenKeys: Object.keys(token || {}),
        sessionUserKeys: Object.keys(session?.user || {})
      });
      
      // Ensure session.user exists
      if (!session.user) {
        session.user = {
          email: "",
          name: null,
          image: null,
        } as any;
      }
      
      // Add user info from token to session
      if (token && token.user) {
        // Merge user info from token into session.user
        const tokenUser = token.user as any;
        session.user = {
          email: tokenUser.email || token.email || session.user.email || "",
          name: tokenUser.nickname || session.user.name || tokenUser.email?.split("@")[0] || "",
          image: tokenUser.avatar_url || session.user.image || null,
          // Add custom fields - these must be included in the return
          uuid: tokenUser.uuid,
          nickname: tokenUser.nickname,
          avatar_url: tokenUser.avatar_url,
          created_at: tokenUser.created_at,
        };
        console.log("Session user updated:", { 
          email: session.user.email, 
          uuid: (session.user as any).uuid,
          nickname: (session.user as any).nickname,
          name: session.user.name
        });
      } else if (token?.email) {
        // Fallback: if token has email but no user object, at least set email
        session.user.email = token.email as string;
        session.user.name = session.user.name || token.email.split("@")[0] || "";
        console.log("Set email from token:", token.email);
      }
      
      // Always ensure email is set
      if (!session.user.email && token?.email) {
        session.user.email = token.email as string;
      }
      
      // Ensure name is set
      if (!session.user.name && session.user.email) {
        session.user.name = session.user.email.split("@")[0] || "";
      }
      
      console.log("Session callback returning:", {
        hasUser: !!session.user,
        userEmail: session.user?.email,
        userUuid: (session.user as any)?.uuid,
        userKeys: Object.keys(session.user || {}),
        sessionUserType: typeof session.user,
        sessionString: JSON.stringify(session, null, 2).substring(0, 800)
      });
      
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      console.log("JWT callback called:", { 
        hasUser: !!user, 
        userEmail: user?.email,
        hasAccount: !!account,
        accountProvider: account?.provider,
        tokenEmail: token?.email,
        hasTokenUser: !!token?.user
      });
      
      try {
        // If user exists (first time login), save user info
        if (user && user.email) {
          console.log("Processing new user login:", { email: user.email, id: user.id });
          
          const dbUser: User = {
            uuid: getUuid(),
            email: user.email,
            nickname: user.name || "",
            avatar_url: user.image || "",
            signin_type: account?.type || "credentials",
            signin_provider: account?.provider || "credentials",
            signin_openid: account?.providerAccountId || user.id,
            created_at: getIsoTimestr(),
            signin_ip: await getClientIp(),
          };

          try {
            console.log("Saving user to database:", { email: user.email });
            const savedUser = await saveUser(dbUser);
            console.log("User saved successfully:", { uuid: savedUser.uuid, email: savedUser.email });

            token.user = {
              uuid: savedUser.uuid,
              email: savedUser.email,
              nickname: savedUser.nickname,
              avatar_url: savedUser.avatar_url,
              created_at: savedUser.created_at,
            };
            token.email = savedUser.email;
            
            console.log("Token updated with user info:", { 
              tokenEmail: token.email, 
              tokenUserUuid: (token.user as any)?.uuid 
            });
          } catch (e) {
            console.error("save user failed:", e);
            // If save failed but user exists in DB, try to fetch it
            try {
              const { findUserByEmail } = await import("@/models/user");
              const existingUser = await findUserByEmail(user.email);
              if (existingUser) {
                console.log("Found existing user:", { uuid: existingUser.uuid, email: existingUser.email });
                token.user = {
                  uuid: existingUser.uuid,
                  email: existingUser.email,
                  nickname: existingUser.nickname,
                  avatar_url: existingUser.avatar_url,
                  created_at: existingUser.created_at,
                };
                token.email = existingUser.email;
              } else {
                console.error("User not found in database after save failure");
                // Still set email even if user not in DB
                token.email = user.email;
              }
            } catch (fetchError) {
              console.error("fetch existing user failed:", fetchError);
              // Still set email even if fetch failed
              token.email = user.email;
            }
          }
        } else if (token.email && !token.user) {
          // If token has email but no user info, fetch from DB
          try {
            console.log("Fetching user from DB by email:", token.email);
            const { findUserByEmail } = await import("@/models/user");
            const existingUser = await findUserByEmail(token.email as string);
            if (existingUser) {
              console.log("Found user in DB:", { uuid: existingUser.uuid, email: existingUser.email });
              token.user = {
                uuid: existingUser.uuid,
                email: existingUser.email,
                nickname: existingUser.nickname,
                avatar_url: existingUser.avatar_url,
                created_at: existingUser.created_at,
              };
            } else {
              console.warn("User not found in DB for email:", token.email);
            }
          } catch (fetchError) {
            console.error("fetch user failed:", fetchError);
          }
        }
        
        // Ensure email is set in token
        if (user?.email && !token.email) {
          token.email = user.email;
          console.log("Set email in token:", user.email);
        }
        
        console.log("JWT callback returning token:", { 
          hasEmail: !!token.email, 
          hasUser: !!token.user,
          userUuid: (token.user as any)?.uuid
        });
        
        return token;
      } catch (e) {
        console.error("jwt callback error:", e);
        return token;
      }
    },
  },
};
