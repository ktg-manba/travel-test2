"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SiGoogle } from "react-icons/si";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

export default function SignModal() {
  const t = useTranslations();
  const { showSignModal, setShowSignModal } = useAppContext();

  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("sign_modal.sign_in_title")}</DialogTitle>
            <DialogDescription>
              {t("sign_modal.sign_in_description")}
            </DialogDescription>
          </DialogHeader>
          <ProfileForm onSuccess={() => setShowSignModal(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={showSignModal} onOpenChange={setShowSignModal}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("sign_modal.sign_in_title")}</DrawerTitle>
          <DrawerDescription>
            {t("sign_modal.sign_in_description")}
          </DrawerDescription>
        </DrawerHeader>
        <ProfileForm className="px-4" onSuccess={() => setShowSignModal(false)} />
        <DrawerFooter className="pt-4">
          <DrawerClose asChild>
            <Button variant="outline">{t("sign_modal.cancel_title")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function ProfileForm({ 
  className,
  onSuccess,
}: React.ComponentProps<"form"> & { onSuccess?: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t("sign_modal.email_password_required"));
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // For signup, still use the API route to create user in Supabase Auth
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const { code, message } = await response.json();

        if (code !== 0) {
          toast.error(message || t("sign_modal.error"));
          return;
        }

        toast.success(t("sign_modal.signup_success"));
        // After signup, sign in with Next-Auth
        console.log("Signup successful, signing in with credentials:", { email });
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        console.log("Sign in result after signup:", { error: signInResult?.error, ok: signInResult?.ok });

        if (signInResult?.error) {
          console.error("Sign in error after signup:", signInResult.error);
          toast.error(t("sign_modal.error"));
          return;
        }

        if (!signInResult?.ok) {
          console.error("Sign in failed after signup:", signInResult);
          toast.error(t("sign_modal.error"));
          return;
        }

        console.log("Sign in successful after signup, updating session...");
        // Update session and refresh
        await updateSession();
        console.log("Session update called after signup");
        
        // Wait a bit longer to ensure session is fully updated
        setTimeout(() => {
          console.log("Refreshing router after signup...");
          router.refresh();
          setTimeout(() => {
            onSuccess?.();
          }, 200);
        }, 800);
      } else {
        // For signin, use Next-Auth credentials provider
        console.log("Attempting to sign in with credentials:", { email });
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        console.log("Sign in result:", { error: signInResult?.error, ok: signInResult?.ok });

        if (signInResult?.error) {
          console.error("Sign in error:", signInResult.error);
          toast.error(t("sign_modal.error") || "Invalid email or password");
          return;
        }

        if (!signInResult?.ok) {
          console.error("Sign in failed:", signInResult);
          toast.error(t("sign_modal.error") || "Sign in failed");
          return;
        }

        toast.success(t("sign_modal.signin_success"));
        console.log("Sign in successful, updating session...");
        
        // Update session and refresh
        await updateSession();
        console.log("Session update called");
        
        // Wait a bit longer to ensure session is fully updated
        setTimeout(() => {
          console.log("Refreshing router...");
          router.refresh();
          setTimeout(() => {
            onSuccess?.();
          }, 200);
        }, 800);
      }
    } catch (e) {
      console.error("Auth error:", e);
      toast.error(t("sign_modal.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // 使用 next-auth 的 signIn 函数
      await signIn("google", {
        callbackUrl: window.location.href,
        redirect: true,
      });
    } catch (e) {
      console.error("Google auth error:", e);
      toast.error(t("sign_modal.error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("grid items-start gap-4", className)}>
      <div className="grid gap-2">
        <Label htmlFor="email">{t("sign_modal.email_title")}</Label>
        <Input
          type="email"
          id="email"
          placeholder={t("sign_modal.email_placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{t("sign_modal.password_title")}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t("sign_modal.password_placeholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          minLength={6}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            {t("sign_modal.loading")}
          </>
        ) : (
          isSignUp ? t("sign_modal.sign_up_title") : t("sign_modal.sign_in_title")
        )}
      </Button>

      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">
          {t("sign_modal.or")}
        </span>
      </div>

      {process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" && (
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <SiGoogle className="w-4 h-4" />
          {t("sign_modal.google_sign_in")}
        </Button>
      )}

      <div className="text-center text-sm">
        {isSignUp ? (
          <>
            {t("sign_modal.have_account")}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className="underline underline-offset-4 hover:text-primary"
            >
              {t("sign_modal.sign_in_title")}
            </button>
          </>
        ) : (
          <>
            {t("sign_modal.no_account")}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className="underline underline-offset-4 hover:text-primary"
            >
              {t("sign_modal.sign_up_title")}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
