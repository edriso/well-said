import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

type Props = { theme: Theme; onToggle: () => void };

export function ThemeToggle({ theme, onToggle }: Props) {
  const next = theme === 'light' ? 'dark' : 'light';
  return (
    <button className="icon-button theme-toggle" onClick={onToggle} aria-label={`Use ${next} theme`} title={`Use ${next} theme`}>
      {theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
}
