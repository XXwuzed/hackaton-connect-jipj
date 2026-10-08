import type { ReactNode } from 'react';
import { Brand, Icon } from '@club/ui';
import { publicMessages as copy } from '../messages/public';

/** Enmarca las pantallas públicas con la misma identidad y navegación accesible. */
export function PublicLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">
        {copy.skip}
      </a>
      <header className="public-header">
        <Brand />
        <span className="header-note">
          <Icon name="heart" />
          {copy.header}
        </span>
      </header>
      {children}
      <footer className="public-footer">
        <span>{copy.footer}</span>
        <span className="brand-palette" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      </footer>
    </div>
  );
}
