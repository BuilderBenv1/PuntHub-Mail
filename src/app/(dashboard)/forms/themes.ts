export type FormTheme = {
  id: string;
  name: string;
  description: string;
  // Colors
  backgroundColor: string;
  cardBackground: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  // Button
  buttonBackground: string;
  buttonText: string;
  buttonHoverBackground: string;
  // Border radius
  borderRadius: string;
  // Font
  fontFamily: string;
};

export const THEMES: Record<string, FormTheme> = {
  clean: {
    id: "clean",
    name: "Clean",
    description: "Simple white with blue accents",
    backgroundColor: "#f8fafc",
    cardBackground: "#ffffff",
    accentColor: "#2563eb",
    textColor: "#1e293b",
    mutedTextColor: "#64748b",
    inputBackground: "#ffffff",
    inputBorder: "#e2e8f0",
    inputText: "#1e293b",
    buttonBackground: "#2563eb",
    buttonText: "#ffffff",
    buttonHoverBackground: "#1d4ed8",
    borderRadius: "0.5rem",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  "racing-green": {
    id: "racing-green",
    name: "Racing Green",
    description: "Dark green with gold accents – perfect for PuntHub",
    backgroundColor: "#0a1f0a",
    cardBackground: "#132613",
    accentColor: "#d4a017",
    textColor: "#e8f5e8",
    mutedTextColor: "#8fbc8f",
    inputBackground: "#1a3a1a",
    inputBorder: "#2d5a2d",
    inputText: "#e8f5e8",
    buttonBackground: "#d4a017",
    buttonText: "#0a1f0a",
    buttonHoverBackground: "#b8860b",
    borderRadius: "0.5rem",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  dark: {
    id: "dark",
    name: "Dark",
    description: "Sleek dark mode with purple accents",
    backgroundColor: "#09090b",
    cardBackground: "#18181b",
    accentColor: "#8b5cf6",
    textColor: "#fafafa",
    mutedTextColor: "#a1a1aa",
    inputBackground: "#27272a",
    inputBorder: "#3f3f46",
    inputText: "#fafafa",
    buttonBackground: "#8b5cf6",
    buttonText: "#ffffff",
    buttonHoverBackground: "#7c3aed",
    borderRadius: "0.5rem",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with subtle borders",
    backgroundColor: "#ffffff",
    cardBackground: "#ffffff",
    accentColor: "#171717",
    textColor: "#171717",
    mutedTextColor: "#737373",
    inputBackground: "#ffffff",
    inputBorder: "#d4d4d4",
    inputText: "#171717",
    buttonBackground: "#171717",
    buttonText: "#ffffff",
    buttonHoverBackground: "#404040",
    borderRadius: "0.25rem",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  bold: {
    id: "bold",
    name: "Bold",
    description: "Vibrant gradient with rounded corners",
    backgroundColor: "#4f46e5",
    cardBackground: "#ffffff",
    accentColor: "#4f46e5",
    textColor: "#1e1b4b",
    mutedTextColor: "#6366f1",
    inputBackground: "#f5f3ff",
    inputBorder: "#c7d2fe",
    inputText: "#1e1b4b",
    buttonBackground: "#4f46e5",
    buttonText: "#ffffff",
    buttonHoverBackground: "#4338ca",
    borderRadius: "1rem",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange and coral tones",
    backgroundColor: "#fff7ed",
    cardBackground: "#ffffff",
    accentColor: "#ea580c",
    textColor: "#431407",
    mutedTextColor: "#9a3412",
    inputBackground: "#ffffff",
    inputBorder: "#fed7aa",
    inputText: "#431407",
    buttonBackground: "#ea580c",
    buttonText: "#ffffff",
    buttonHoverBackground: "#c2410c",
    borderRadius: "0.75rem",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
};

export const DEFAULT_THEME = "clean";

export function getTheme(themeId: string | null): FormTheme {
  return THEMES[themeId || DEFAULT_THEME] || THEMES[DEFAULT_THEME];
}

export function applyCustomColors(
  theme: FormTheme,
  overrides: { accentColor?: string | null; backgroundColor?: string | null }
): FormTheme {
  return {
    ...theme,
    ...(overrides.accentColor && {
      accentColor: overrides.accentColor,
      buttonBackground: overrides.accentColor,
    }),
    ...(overrides.backgroundColor && {
      backgroundColor: overrides.backgroundColor,
    }),
  };
}
