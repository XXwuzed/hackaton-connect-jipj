import { useAuth } from '../auth-context';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Brand, Icon } from '@club/ui';
import { navigationGroups } from './navigation';
import { navigationMessages as copy } from '../../messages/navigation';

/** Identifica la sesión y permite cerrarla. */
export function Topbar({
  navigationOpen = false,
  onToggleNavigation,
}: {
  navigationOpen?: boolean;
  onToggleNavigation?(): void;
}): JSX.Element {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const current =
    navigationGroups
      .flatMap((group) => group.items)
      .find((item) => item.to === pathname) ??
    navigationGroups
      .flatMap((group) => group.items)
      .find((item) => item.to !== '/' && pathname.startsWith(`${item.to}/`));
  const initials = `${user?.firstName.charAt(0) ?? ''}${user?.lastName.charAt(0) ?? ''}`;
  async function signOut() {
    setBusy(true);
    setError('');
    try {
      await logout();
    } catch {
      setError(copy.logoutError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <header className="app-topbar">
      <div className="topbar-context">
        {onToggleNavigation && (
          <button
            className="icon-button mobile-menu-toggle"
            aria-label={copy.toggle}
            aria-controls="app-navigation"
            aria-expanded={navigationOpen}
            onClick={onToggleNavigation}
          >
            <Icon name={navigationOpen ? 'close' : 'menu'} />
          </button>
        )}
        <span className="topbar-mobile-brand">
          <Brand compact />
        </span>
        <span className="breadcrumb">
          <span>{copy.workspace}</span>
          <Icon name="chevron" />
          <strong>{current?.label ?? copy.profile}</strong>
        </span>
      </div>
      <div className="topbar-account">
        <span className="user-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="user-info">
          <strong>
            {user?.firstName} {user?.lastName}
          </strong>
          <small>{user?.role === 'ADMIN' ? copy.admin : copy.advisor}</small>
        </span>
        <button
          className="signout-button"
          onClick={() => void signOut()}
          disabled={busy}
        >
          <Icon name="logout" />
          <span>{copy.logout}</span>
        </button>
      </div>
      {error && (
        <p className="topbar-error" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}
