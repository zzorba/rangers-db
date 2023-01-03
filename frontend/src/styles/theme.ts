import { extendTheme } from '@chakra-ui/react';
import { mode, Styles } from '@chakra-ui/theme-tools';

const styles: Styles = {
  global: (props) => ({
    '.site-footer': {
      backgroundColor: mode('gray.300', 'gray.700')(props),
      p: {
        color: mode('black', 'white')(props),
      },
    },
    '.pagination-previous': {
      background: mode('gray.100', 'gray.900')(props),
      color: '#222222',
    },
    '.pagination-next': {
      background: mode('gray.100', 'gray.900')(props),
      color: '#222222',
    },
    '.lightText': {
      color: mode('#666666', '#AAAAAA')(props),
    }
  }),
};

const theme = extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: false,
  fonts: {
    heading: `'Open Sans', sans-serif`,
    body: `'Source Sans Pro', sans-serif`,
  },
  styles,
  colors: {
    light: {
      lightText: '#666666',
      text: 'black',
      inverted: 'white',
      background: 'white',
      lightBackground: '#AAAAAA',
      aspect: {
        AWA: '#306938',
        FOC: '#1e2f64',
        FIT: '#811019',
        SPI: '#da6e17',
        NEUTRAL: '#888888',
      },
    },
    dark: {
      lightText: '#AAAAAA',
      text: 'white',
      inverted: 'black',
      background: 'dark',
      lightBackground: '#444444',
      aspect: {
        AWA: '#6aa673',
        FOC: '#446ae3',
        FIT: '#ce3b47',
        SPI: '#f58225',
        NEUTRAL: '#888888'
      },
    },
    aspect: {
      AWA: '#306938',
      FOC: '#1e2f64',
      FIT: '#811019',
      SPI: '#da6e17',
      NEUTRAL: '#888888',
    },
  },
});

export default theme