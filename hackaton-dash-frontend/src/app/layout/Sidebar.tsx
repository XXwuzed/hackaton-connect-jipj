import { Link } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { canSee } from '../../lib/permissions';

/** Muestra opciones por permiso; el backend vuelve a autorizar. */
export function Sidebar(): JSX.Element {
  const { user } = useAuth();
  return (
    <nav
      aria-label="Principal"
      className="min-h-screen w-48 bg-primary p-4 text-white"
    >
      {user && canSee(user.role, 'dashboard:read') ? (
        <Link to="/">Inicio</Link>
      ) : (
        <Link to="/">Inicio</Link>
      )}
      {user && canSee(user.role, 'customers:read') && (
        <Link className="mt-4 block" to="/customers">
          Clientes
        </Link>
      )}
      {user && canSee(user.role, 'redemptions:create') && (
        <Link className="mt-4 block" to="/redemptions/new">
          Registrar canje
        </Link>
      )}
      {user && canSee(user.role, 'dice:create') && (
        <Link className="mt-4 block" to="/dice/new">
          Registrar dados
        </Link>
      )}
      {user && canSee(user.role, 'redeemable-products:read') && (
        <Link className="mt-4 block" to="/advisor-products">
          Productos
        </Link>
      )}
      {user && canSee(user.role, 'redemptions:read') && (
        <Link className="mt-4 block" to="/redemptions">
          Canjes
        </Link>
      )}
      {user && canSee(user.role, 'dice:read') && (
        <Link className="mt-4 block" to="/dice/rolls">
          Dados
        </Link>
      )}
      {user && canSee(user.role, 'dice-prizes:manage') && (
        <Link className="mt-4 block" to="/dice/prizes">
          Premios
        </Link>
      )}
      {user && canSee(user.role, 'catalog:read') && (
        <Link className="mt-4 block" to="/catalog">
          Catálogo
        </Link>
      )}
      {user && canSee(user.role, 'redeemable-products:manage') && (
        <Link className="mt-4 block" to="/redeemables">
          Canjeables
        </Link>
      )}
      {user && canSee(user.role, 'zones:manage') && (
        <Link className="mt-4 block" to="/zones">
          Zonas
        </Link>
      )}
      {user && canSee(user.role, 'settings:update') && (
        <Link className="mt-4 block" to="/settings/loyalty">
          Ajustes
        </Link>
      )}
      {user && canSee(user.role, 'users:manage') && (
        <Link className="mt-4 block" to="/users">
          Usuarios
        </Link>
      )}
      {user && canSee(user.role, 'product-rotation:read') && (
        <Link className="mt-4 block" to="/rotation">
          Rotación
        </Link>
      )}
      {user && canSee(user.role, 'audit:read') && (
        <Link className="mt-4 block" to="/audit">
          Auditoría
        </Link>
      )}
      {user && canSee(user.role, 'profile:update') && (
        <Link className="mt-4 block" to="/profile">
          Mi información
        </Link>
      )}
    </nav>
  );
}
