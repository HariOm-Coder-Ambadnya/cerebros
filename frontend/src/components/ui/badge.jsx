import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[var(--accent)]/20 bg-[var(--accent-light)] text-[var(--accent)]',
        secondary: 'border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
        destructive: 'border-red-500/20 bg-red-500/10 text-red-400',
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
        outline: 'border-[var(--border)] text-[var(--text-secondary)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
