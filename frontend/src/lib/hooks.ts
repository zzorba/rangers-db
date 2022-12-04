import { useEffect, useMemo } from 'react';
import Router,{ useRouter } from 'next/router';
import { useAuth } from './AuthContext';

export function useRequireAuth() {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !authUser) {
      const redirect = router.query['redirect'];
      if (redirect) {
        if (typeof redirect === 'string') {
          Router.replace({ pathname: '/login', query: { redirect: redirect }});
        } else {
          Router.replace({ pathname: '/login', query: { redirect: redirect[0] }});
        }
      }
      Router.replace({ pathname: '/login', query: { redirect: router.pathname }});
    }
  }, [loading, authUser]);
}

export function usePostLoginRedirect(): string | undefined {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  console.log(router.query, router.isReady);
  const redirect = useMemo(() => {
    const redirect = router.query['redirect'];
    if (redirect) {
      if (typeof redirect === 'string') {
        return redirect;
      } else {
        return redirect[0];
      }
    }
    return undefined;
  }, [router]);
  useEffect(() => {
    if (!loading && authUser) {
      console.log(redirect);
      if (redirect && redirect.startsWith('/')) {
        Router.push(redirect);
      } else {
        Router.push('/');
      }
    }
  }, [loading, authUser, redirect]);
  return redirect;
}