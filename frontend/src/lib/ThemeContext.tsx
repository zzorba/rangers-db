import { color, useColorMode, useColorModeValue } from '@chakra-ui/react';
import React, { createContext, useContext, useMemo } from 'react';

interface ThemeContextType {
  colors: {
    divider: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({
  colors: {
    divider: 'gray.100'
  }
});

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const { colorMode } = useColorMode();
  const context = useMemo(() => {
    return {
      colors: {
        divider: colorMode === 'light' ? 'gray.200' : 'gray.700',
      },
    };
  }, [colorMode])
  return (
    <ThemeContext.Provider value={context}>
      { children }
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}