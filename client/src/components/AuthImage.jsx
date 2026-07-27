import { useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import api from '../services/api.js';

// Fetches a protected file (e.g. verification document) with the auth header
// and renders it via an object URL. Falls back to a link for PDFs.
export default function AuthImage({ url, alt = '', className = '' }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    let objectUrl;
    let active = true;
    setSrc(null);
    setError(false);
    // url looks like "/api/files/documents/xyz"; strip the /api prefix for the axios baseURL.
    const path = url.replace(/^\/api/, '');
    api.get(path, { responseType: 'blob' })
      .then((res) => {
        if (!active) return;
        const type = res.data.type || '';
        if (type.includes('pdf')) setIsPdf(true);
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (error) {
    return (
      <div className={`grid place-items-center rounded-xl bg-surface-sunken text-ink-faint ${className}`}>
        <div className="flex flex-col items-center gap-1 p-4 text-center"><FileText size={22} /><span className="text-xs">Preview unavailable</span></div>
      </div>
    );
  }
  if (!src) {
    return (
      <div className={`grid place-items-center rounded-xl bg-surface-sunken ${className}`}>
        <Loader2 size={20} className="animate-spin-slow text-ink-faint" />
      </div>
    );
  }
  if (isPdf) {
    return (
      <a href={src} target="_blank" rel="noreferrer" className={`grid place-items-center rounded-xl bg-surface-sunken text-brand-600 ${className}`}>
        <div className="flex flex-col items-center gap-1 p-4"><FileText size={22} /><span className="text-xs font-semibold">Open PDF</span></div>
      </a>
    );
  }
  return <img src={src} alt={alt} className={`rounded-xl object-cover ${className}`} />;
}
