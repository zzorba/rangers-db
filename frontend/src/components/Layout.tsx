import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      { children }
      <Footer />
    </>
  )
}