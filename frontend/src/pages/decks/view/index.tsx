import { useEffect } from 'react';
import Router from 'next/router';

import LoadingPage from '../../../components/LoadingPage';
import { getLocalizationServerSideProps } from '../../../lib/Lingui';

export default function ViewIndex() {
  useEffect(() => {
    Router.replace('/decks');
  }, []);
  return <LoadingPage />;
}

export const getServerSideProps = getLocalizationServerSideProps;
