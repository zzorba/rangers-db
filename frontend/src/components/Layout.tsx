import React from 'react';
import { Box } from '@chakra-ui/react';

import NavBar from './NavBar';
import Footer from './Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <Box minH="80vh">
        { children }
      </Box>
      <Footer />
    </>
  )
}