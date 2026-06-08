import { createContext, useState, useEffect, useContext, useCallback } from 'react';

/**
 * Theme Context
 * Manages dark/light mode globally with localStorage persistence
 */
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage, fallback to false (light mode)
    try {
      const saved = localStorage.getItem('infratrack-theme');
      return saved === 'dark';
    } catch {
      return false;
    }
  });

  // Apply/remove the 'dark' class on <html> whenever isDarkMode changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('infratrack-theme', isDarkMode ? 'dark' : 'light');
    } catch {
      // silently ignore storage errors
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
