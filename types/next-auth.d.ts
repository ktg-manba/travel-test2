import "next-auth";

declare module "next-auth" {
  interface JWT {
    email?: string;
    user?: {
      uuid?: string;
      email?: string;
      nickname?: string;
      avatar_url?: string;
      created_at?: string;
    };
  }

  interface Session {
    user: {
      uuid?: string;
      email?: string;
      nickname?: string;
      avatar_url?: string;
      created_at?: string;
    } & DefaultSession["user"];
  }
}
