export const APP_THEME_KEY = "mycroshop.appTheme";
export const APP_THEME_CHANGE_EVENT = "mycroshop-theme-change";

const normalizeAppTheme = (theme) => (theme === "dark" ? "dark" : "light");
const INLINE_THEME_COLOR_ATTR = "data-mycroshop-theme-original-color";

let themeObserver;

const parseColorToRgb = (colorValue) => {
  if (!colorValue) {
    return null;
  }

  const normalizedColor = colorValue.trim().toLowerCase();

  if (normalizedColor.startsWith("#")) {
    const hex = normalizedColor.slice(1);

    if (hex.length === 3) {
      return {
        r: Number.parseInt(hex[0] + hex[0], 16),
        g: Number.parseInt(hex[1] + hex[1], 16),
        b: Number.parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }

    if (hex.length === 6) {
      return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }

    return null;
  }

  const rgbMatch = normalizedColor.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\s*\)$/
  );

  if (!rgbMatch) {
    return null;
  }

  return {
    r: Number.parseInt(rgbMatch[1], 10),
    g: Number.parseInt(rgbMatch[2], 10),
    b: Number.parseInt(rgbMatch[3], 10),
    a: rgbMatch[4] === undefined ? 1 : Number.parseFloat(rgbMatch[4]),
  };
};

const isDarkLikeTextColor = (colorValue) => {
  const rgb = parseColorToRgb(colorValue);

  if (!rgb || Number.isNaN(rgb.a) || rgb.a === 0) {
    return false;
  }

  const { r, g, b } = rgb;
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  const channelSpread = maxChannel - minChannel;
  const normalizedLuminance =
    (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  if (normalizedLuminance <= 0.46) {
    return true;
  }

  if (normalizedLuminance <= 0.64 && channelSpread <= 72) {
    return true;
  }

  return false;
};

const getThemeMappedColor = (colorValue) => {
  if (!isDarkLikeTextColor(colorValue)) {
    return null;
  }

  return "var(--app-text)";
};

const restoreElementColor = (element) => {
  const originalInlineColor = element.getAttribute(INLINE_THEME_COLOR_ATTR);

  if (originalInlineColor === null) {
    return;
  }

  if (originalInlineColor) {
    element.style.color = originalInlineColor;
  } else {
    element.style.removeProperty("color");
  }

  element.removeAttribute(INLINE_THEME_COLOR_ATTR);
};

const syncElementThemeColor = (element, theme) => {
  if (!(element instanceof HTMLElement) || !element.style) {
    return;
  }

  if (theme !== "dark") {
    restoreElementColor(element);
    return;
  }

  const originalInlineColor = element.getAttribute(INLINE_THEME_COLOR_ATTR);

  if (originalInlineColor !== null) {
    return;
  }

  const declaredColor = element.style.color || window.getComputedStyle(element).color;
  const mappedThemeColor = getThemeMappedColor(declaredColor);

  if (!mappedThemeColor) {
    return;
  }

  element.setAttribute(INLINE_THEME_COLOR_ATTR, element.style.color || "");
  element.style.color = mappedThemeColor;
};

const syncThemeColors = (root, theme) => {
  if (typeof document === "undefined" || !(root instanceof HTMLElement)) {
    return;
  }

  syncElementThemeColor(root, theme);
  root.querySelectorAll("*").forEach((element) => {
    syncElementThemeColor(element, theme);
  });
};

const ensureThemeObserver = () => {
  if (typeof document === "undefined" || themeObserver) {
    return;
  }

  themeObserver = new MutationObserver((mutations) => {
    const currentTheme = getStoredAppTheme();

    if (currentTheme !== "dark") {
      return;
    }

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          syncThemeColors(node, currentTheme);
        }
      });
    });
  });

  themeObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

export const getStoredAppTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    return normalizeAppTheme(localStorage.getItem(APP_THEME_KEY));
  } catch {
    return "light";
  }
};

export const applyAppTheme = (theme) => {
  const nextTheme = normalizeAppTheme(theme);

  if (typeof document !== "undefined") {
    document.body.classList.toggle("mycroshop-theme-dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    ensureThemeObserver();
    syncThemeColors(document.body, nextTheme);
  }

  return nextTheme;
};

export const setStoredAppTheme = (theme) => {
  const nextTheme = applyAppTheme(theme);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(APP_THEME_KEY, nextTheme);
    } catch {
      // Ignore storage errors.
    }

    window.dispatchEvent(
      new CustomEvent(APP_THEME_CHANGE_EVENT, {
        detail: nextTheme,
      })
    );
  }

  return nextTheme;
};
