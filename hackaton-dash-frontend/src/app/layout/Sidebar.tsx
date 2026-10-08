import { NavLink } from 'react-router-dom';
import { Brand, Icon } from '@club/ui';
import { useAuth } from '../auth-context';
import { canSee } from '../../lib/permissions';
import { navigationGroups } from './navigation';
import { navigationMessages as copy } from '../../messages/navigation';

/** Muestra opciones por permiso; el backend vuelve a autorizar. */
export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate(): void;
}): JSX.Element {
  const { user } = useAuth();
  return (
    <aside
      id="app-navigation"
      className={`app-sidebar${open ? ' app-sidebar--open' : ''}`}
    >
      <div className="sidebar-brand">
        <Brand />
      </div>
      <nav aria-label={copy.navigation} className="sidebar-nav">
        {navigationGroups.map((group) => {
          const items = group.items.filter(
            (item) =>
              user && (!item.permission || canSee(user.role, item.permission)),
          );
          if (!items.length) return null;
          return (
            <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `nav-item${isActive ? ' nav-item--active' : ''}`
                  }
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-community">
        <Icon name="heart" />
        <strong>{copy.communityTitle}</strong>
        <p>{copy.communityDescription}</p>
      </div>
    </aside>
  );
}
