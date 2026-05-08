const DEFAULT_STOREFRONT_THEME = {
  background_color: "#f3eceb",
  surface: "#f8f2f1",
  card: "#ffffff",
  primary: "#7b7370",
  primary_light: "#e9e4e2",
  primary_dark: "#2e2a28",
  primary_muted: "rgba(123,115,112,0.12)",
  button_color: "#7b7370",
  button_font_color: "#ffffff",
  text_primary: "#2e2a28",
  text_secondary: "#6b6462",
  text_tertiary: "#9a9290",
  border_default: "#e2dcda",
  border_accent: "rgba(123,115,112,0.32)",
};

const getThemeColor = (theme, key) => {
  const value = theme?.[key];
  if (typeof value !== "string") return DEFAULT_STOREFRONT_THEME[key];

  const trimmed = value.trim();
  return trimmed || DEFAULT_STOREFRONT_THEME[key];
};

export const buildStorefrontThemeStyle = (selectedTheme) => {
  const theme = Object.keys(DEFAULT_STOREFRONT_THEME).reduce((acc, key) => {
    acc[key] = getThemeColor(selectedTheme, key);
    return acc;
  }, {});

  return {
    "--customer-home-background": theme.background_color,
    "--customer-home-surface": theme.surface,
    "--customer-home-card": theme.card,
    "--customer-home-primary": theme.primary,
    "--customer-home-primary-light": theme.primary_light,
    "--customer-home-primary-dark": theme.primary_dark,
    "--customer-home-primary-muted": theme.primary_muted,
    "--customer-home-button": theme.button_color,
    "--customer-home-button-text": theme.button_font_color,
    "--customer-home-text-primary": theme.text_primary,
    "--customer-home-text-secondary": theme.text_secondary,
    "--customer-home-text-tertiary": theme.text_tertiary,
    "--customer-home-border": theme.border_default,
    "--customer-home-border-accent": theme.border_accent,
  };
};
