import { useColorMode } from '@chakra-ui/react';
import React, { createContext, useContext, useMemo } from 'react';

interface ThemeContextType {
  colors: {
    divider: string;
    hover: string;
    icon: string;
    text: string;
    background: string;
    inverted: string;
    lightText: string;
    lightBackground: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({
  colors: {
    lightText: 'light.lightText',
    lightBackground: 'light.lightBackground',
    text: 'light.text',
    inverted: 'light.inverted',
    background: 'light.background',
    divider: 'gray.200',
    hover: 'gray.100',
    icon: '#666666',
  },
});

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const { colorMode } = useColorMode();
  const context = useMemo(() => {
    return {
      colors: {
        lightText: `${colorMode}.lightText`,
        lightBackground: `${colorMode}.lightBackground`,
        text: `${colorMode}.text`,
        inverted: `${colorMode}.inverted`,
        background: `${colorMode}.background`,
        divider: colorMode === 'light' ? 'gray.200' : 'gray.700',
        hover: colorMode === 'light' ? 'gray.100' : 'gray.700',
        icon: colorMode === 'light' ? '#666666' : '#DDDDDD',
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