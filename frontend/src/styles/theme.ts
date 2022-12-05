import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: `'Open Sans', sans-serif`,
    body: `'Source Sans Pro', sans-serif`,
  },
  colors: {
    aspect: {
      AWA: '#306938',
      FOC: '#1e2f64',
      FIT: '#811019',
      SPI: '#da6e17',
    },
  },
});

export default theme