"use client";

import Analytics from "@/components/analytics";
import { CacheKey } from "@/services/constant";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import SignModal from "@/components/sign/modal";
import type { ThemeProviderProps } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { cacheGet } from "@/lib/cache";
import { useAppContext } from "@/contexts/app";
import { useEffect } from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { theme, setTheme } = useAppContext();

  useEffect(() => {
    const themeInCache = cacheGet(CacheKey.Theme);
    if (themeInCache) {
      // theme setted - trim whitespace and newlines
      const cleanedTheme = themeInCache.trim();
      if (["dark", "light"].includes(cleanedTheme)) {
        setTheme(cleanedTheme);
        return;
      }
    } else {
      // theme not set - trim whitespace and newlines from env var
      const defaultTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME?.trim();
      if (defaultTheme && ["dark", "light"].includes(defaultTheme)) {
        setTheme(defaultTheme);
        return;
      }
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = () => {
      setTheme(mediaQuery.matches ? "dark" : "light");
    };
    mediaQuery.addListener(handleChange);

    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  // Ensure theme value is cleaned before passing to NextThemesProvider
  const cleanedTheme = theme?.trim() || undefined;
  const validTheme = cleanedTheme && ["dark", "light"].includes(cleanedTheme) ? cleanedTheme : undefined;

  return (
    <NextThemesProvider forcedTheme={validTheme} {...props}>
      {children}

      <Toaster position="top-center" richColors />
      <SignModal />
      <Analytics />
    </NextThemesProvider>
  );
}
