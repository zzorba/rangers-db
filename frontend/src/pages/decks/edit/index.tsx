import React, { useEffect} from 'react';
import Router from 'next/router';

import LoadingPage from '../../../components/LoadingPage';

export default function ViewIndex() {
  useEffect(() => {
    Router.replace('/decks');
  }, []);
  return <LoadingPage />;
}

