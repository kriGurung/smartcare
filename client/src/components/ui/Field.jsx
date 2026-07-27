// Label + control wrapper shared by inputs, selects, and textareas.
export function Label({ children, htmlFor, hint }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink-soft">
      {children}
      {hint && <span className="ml-1 font-normal text-ink-faint">{hint}</span>}
    </label>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-danger">{children}</p>;
}

export function Input({ label, hint, error, id, className = '', ...props }) {
  return (
    <div>
      {label && <Label htmlFor={id} hint={hint}>{label}</Label>}
      <input id={id} className={`input-base ${error ? 'border-danger focus:ring-danger/20' : ''} ${className}`} {...props} />
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function Textarea({ label, hint, error, id, className = '', rows = 4, ...props }) {
  return (
    <div>
      {label && <Label htmlFor={id} hint={hint}>{label}</Label>}
      <textarea id={id} rows={rows} className={`input-base resize-y ${error ? 'border-danger' : ''} ${className}`} {...props} />
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function Select({ label, hint, error, id, children, className = '', ...props }) {
  return (
    <div>
      {label && <Label htmlFor={id} hint={hint}>{label}</Label>}
      <select id={id} className={`input-base appearance-none bg-white ${error ? 'border-danger' : ''} ${className}`} {...props}>
        {children}
      </select>
      <FieldError>{error}</FieldError>
    </div>
  );
}
