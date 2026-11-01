import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const ConfirmContext = createContext(() => Promise.resolve(false));

/** Promise-based confirm dialog: `if (await confirm({...})) doIt()`. Used for every destructive action. */
export function ConfirmProvider({ children }) {
  const [opts, setOpts] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options) => new Promise((resolve) => { resolver.current = resolve; setOpts(options); }), []);
  const close = (result) => { resolver.current?.(result); resolver.current = null; setOpts(null); };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!opts} onClose={() => close(false)} title={opts?.title || 'Are you sure?'} size="sm"
        footer={<>
          <button className="btn-outline" onClick={() => close(false)}>{opts?.cancelLabel || 'Keep it'}</button>
          <button className={opts?.tone === 'primary' ? 'btn-primary' : 'btn-danger'} onClick={() => close(true)}>{opts?.confirmLabel || 'Confirm'}</button>
        </>}>
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger"><AlertTriangle size={18} /></div>
          <p className="text-sm text-slate2">{opts?.message}</p>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
