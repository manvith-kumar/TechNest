import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errors';

/** Runs an async loader on mount and whenever deps change; ignores stale responses. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const seq = useRef(0);

  const run = useCallback(() => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    return Promise.resolve()
      .then(loader)
      .then((data) => { if (id === seq.current) setState({ data, loading: false, error: null }); })
      .catch((err) => { if (id === seq.current) setState({ data: null, loading: false, error: getErrorMessage(err) }); });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
