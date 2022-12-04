import { useCallback, useState } from 'react';

import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions } from './initFirebase';
import { omit } from 'lodash';

interface ErrorResponse {
  success: false;
  error: string;
}
interface SuccessResponse {
  success: true;
  error: undefined;
}
type GenericResponse = ErrorResponse | SuccessResponse;

export default function useFirebaseFunction<T, R>(name: string): [
  (t: T) => Promise<R | undefined>,
  String | undefined,
] {
  const [error, setError] = useState<string | undefined>();
  const doFunction = useCallback(async (t: T): Promise<R | undefined> => {
    setError(undefined);
    const f = httpsCallable<T, R & GenericResponse>(firebaseFunctions, name);
    try {
      console.log(`calling ${name}`)
      const result = await f(t);
      if (!result.data.success) {
        setError(result.data.error);
      }
      return result.data;
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message)
      }
      return undefined;
    }
  }, [setError, name]);
  return [doFunction, error];
}