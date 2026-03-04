import { Brain, Upload, MessageSquare, Sun, Moon, Zap, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';

const navItems = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'upload', icon: Upload, label: 'Documents' },
];

export function Sidebar({ activePage, setActivePage }) {
  const { theme, toggle } = useTheme();

  return (
    <aside className="w-16 lg:w-60 flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)] z-10 transition-all duration-300 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            <div className="absolute inset-0 rounded-xl bg-cerebro-500 opacity-20 animate-pulse-slow" />
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-cerebro-400 to-cerebro-700 flex items-center justify-center shadow-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="font-display font-bold text-lg text-[var(--text-primary)] leading-none tracking-tight">
              Cerebro
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Intelligence Hub
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            title={label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 group ${
              activePage === id
                ? 'bg-[var(--accent-light)] text-[var(--accent)] font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${activePage === id ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className="hidden lg:block text-sm">{label}</span>
            {activePage === id && (
              <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="p-3 border-t border-[var(--border)]">
        <Button
          variant="ghost"
          onClick={toggle}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-full justify-start gap-3 px-3"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 shrink-0" />
          )}
          <span className="hidden lg:block text-sm">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        </Button>
      </div>
    </aside>
  );
}
