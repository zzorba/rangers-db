import { useCallback, useState } from 'react';

import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions } from './initFirebase';

interface ErrorResponse {
  success: false;
  error: string;
}
interface SuccessResponse<R> {
  success: true;
  data: R;
  error: undefined;
}
type GenericResponse<R> = ErrorResponse | SuccessResponse<R>;

export default function useFirebaseFunction<T, R={}>(name: string): [
  (t: T) => Promise<GenericResponse<R>>,
  String | undefined,
] {
  const [error, setError] = useState<string | undefined>();
  const doFunction = useCallback(async (t: T): Promise<GenericResponse<R>> => {
    setError(undefined);
    const f = httpsCallable<T, GenericResponse<R>>(firebaseFunctions, name);
    try {
      const result = await f(t);
      console.log(`Raw results: ${JSON.stringify(result)}`)
      if (!result.data.success) {
        setError(result.data.error);
      }
      return result.data;
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message)
      }
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  }, [setError, name]);
  return [doFunction, error];
}