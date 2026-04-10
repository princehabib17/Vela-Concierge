import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageShellProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Renders beside the title block (e.g. settings, share). */
  right?: ReactNode;
  /** Back links or breadcrumbs above the header. */
  beforeHeader?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Shared scroll column + typographic hierarchy for dark atelier routes.
 * Roles: see `.cursor/rules/vela-visual-system.mdc` (Cartier-inspired scale).
 */
export function PageShell({
  kicker,
  title,
  subtitle,
  right,
  beforeHeader,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn('vela-page flex min-h-0 h-full flex-col overflow-y-auto', className)}>
      {beforeHeader}
      <header className={cn('mb-6', right && 'flex items-start justify-between gap-4')}>
        <div className="min-w-0 flex-1">
          {kicker ? <p className="vela-kicker">{kicker}</p> : null}
          <h1 className="vela-page-title">{title}</h1>
          {subtitle ? <p className="vela-page-lede">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0 pt-0.5">{right}</div> : null}
      </header>
      {children}
    </div>
  );
}
