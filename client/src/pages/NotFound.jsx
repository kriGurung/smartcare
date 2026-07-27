import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import { LogoMark } from '../components/Logo.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <LogoMark size={56} />
      <h1 className="mt-6 text-5xl font-bold text-ink">404</h1>
      <p className="mt-2 max-w-sm text-ink-muted">We couldn't find the page you were looking for. It may have moved or no longer exists.</p>
      <Button as={Link} to="/" icon={Home} className="mt-6">Back to home</Button>
    </div>
  );
}
