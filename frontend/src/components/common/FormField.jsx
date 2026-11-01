export default function FormField({ label, error, hint, children, htmlFor }) {
  return (
    <div>
      {label && <label className="label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
