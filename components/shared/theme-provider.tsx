"use client";

import * as React from "react";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  forcedTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  attribute?: string;
  [key: string]: unknown;
}

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  forcedTheme?: string;
  resolvedTheme: string;
  themes: string[];
  systemTheme?: string;
}

const ThemeContext = React.createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  forcedTheme: "light",
  resolvedTheme: "light",
  themes: ["light"],
  systemTheme: "light",
});

export function ThemeProvider({
  children,
  defaultTheme = "light",
  forcedTheme = "light",
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<string>(forcedTheme || defaultTheme || "light");

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      forcedTheme: forcedTheme || "light",
      resolvedTheme: "light",
      themes: ["light"],
      systemTheme: "light",
    }),
    [theme, forcedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return React.useContext(ThemeContext);
}

