import { useEffect, useState } from "react";
import {
  APP_THEME_CHANGE_EVENT,
  APP_THEME_KEY,
  applyAppTheme,
  getStoredAppTheme,
  setStoredAppTheme,
} from "../utils/appTheme";

const useAppTheme = () => {
  const [theme, setTheme] = useState(() => getStoredAppTheme());

  useEffect(() => {
    setTheme(applyAppTheme(getStoredAppTheme()));

    const handleThemeChange = (event) => {
      const nextTheme = event?.detail || getStoredAppTheme();
      setTheme(applyAppTheme(nextTheme));
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === APP_THEME_KEY) {
        setTheme(applyAppTheme(getStoredAppTheme()));
      }
    };

    window.addEventListener(APP_THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(APP_THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const updateTheme = (nextTheme) => {
    setTheme(setStoredAppTheme(nextTheme));
  };

  return {
    theme,
    isDarkTheme: theme === "dark",
    setTheme: updateTheme,
  };
};

export default useAppTheme;
