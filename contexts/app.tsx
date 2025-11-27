"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { cacheGet, cacheRemove } from "@/lib/cache";

import { CacheKey } from "@/services/constant";
import { ContextValue } from "@/types/context";
import { User } from "@/types/user";
import moment from "moment";
import { useSession } from "next-auth/react";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  
  const [theme, setTheme] = useState<string>(() => {
    return process.env.NEXT_PUBLIC_DEFAULT_THEME || "";
  });

  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const fetchUserInfo = async function () {
    try {
      console.log("Fetching user info, session:", { 
        hasSession: !!session, 
        hasUser: !!session?.user, 
        email: session?.user?.email 
      });
      
      const resp = await fetch("/api/get-user-info", {
        method: "POST",
      });

      if (!resp.ok) {
        console.error("fetch user info failed with status:", resp.status);
        throw new Error("fetch user info failed with status: " + resp.status);
      }

      const { code, message, data } = await resp.json();
      console.log("get-user-info response:", { code, message, hasData: !!data });

      if (code !== 0) {
        console.error("get-user-info error:", message);
        throw new Error(message);
      }

      if (data) {
        console.log("Setting user data:", { uuid: data.uuid, email: data.email });
        setUser(data);
        updateInvite(data);
      } else {
        console.log("No user data received");
        setUser(null);
      }
    } catch (e) {
      console.error("fetch user info failed:", e);
      setUser(null);
    }
  };

  const updateInvite = async (user: User) => {
    try {
      if (user.invited_by) {
        // user already been invited
        console.log("user already been invited", user.invited_by);
        return;
      }

      const inviteCode = cacheGet(CacheKey.InviteCode);
      if (!inviteCode) {
        // no invite code
        return;
      }

      const userCreatedAt = moment(user.created_at).unix();
      const currentTime = moment().unix();
      const timeDiff = Number(currentTime - userCreatedAt);

      if (timeDiff <= 0 || timeDiff > 7200) {
        // user created more than 2 hours
        console.log("user created more than 2 hours");
        return;
      }

      // update invite relation
      console.log("update invite", inviteCode, user.uuid);
      const req = {
        invite_code: inviteCode,
        user_uuid: user.uuid,
      };
      const resp = await fetch("/api/update-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });
      if (!resp.ok) {
        throw new Error("update invite failed with status: " + resp.status);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
      cacheRemove(CacheKey.InviteCode);
    } catch (e) {
      console.log("update invite failed: ", e);
    }
  };

  useEffect(() => {
    console.log("Session changed:", { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      email: session?.user?.email,
      userUuid: (session?.user as any)?.uuid,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
      fullSession: session ? JSON.stringify(session, null, 2) : "null"
    });
    
    // If session exists (even without user), try to fetch user info
    // This works because /api/get-user-info uses server-side auth() which has the correct session
    if (session) {
      console.log("Session exists, fetching user info from API...");
      fetchUserInfo();
    } else {
      console.log("No session, clearing user");
      setUser(null);
    }
  }, [session]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        showSignModal,
        setShowSignModal,
        user,
        setUser,
        showFeedback,
        setShowFeedback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
