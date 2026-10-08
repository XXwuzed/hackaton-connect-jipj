import { lazy, Suspense, useState } from 'react';
import { LoadingState } from '@club/ui';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Sidebar } from './layout/Sidebar';
import { Topbar } from './layout/Topbar';
import { useAuth } from './auth-context';
import { canSee } from '../lib/permissions';
import type { Permission } from '@club/contracts';
import { navigationMessages as copy } from '../messages/navigation';

const Dashboard = lazy(() => import('../features/dashboard/pages/Dashboard'));
const Login = lazy(() => import('../features/auth/pages/Login'));
const ChangePassword = lazy(
  () => import('../features/auth/pages/ChangePassword'),
);
const Customers = lazy(() => import('../features/customers/pages/Customers'));
const CustomerDetail = lazy(
  () => import('../features/customers/pages/CustomerDetail'),
);
const RedemptionHistory = lazy(
  () => import('../features/redemptions/pages/RedemptionHistory'),
);
const RedemptionDetail = lazy(
  () => import('../features/redemptions/pages/RedemptionDetail'),
);
const CreateRedemption = lazy(
  () => import('../features/redemptions/pages/CreateRedemption'),
);
const AdvisorProducts = lazy(
  () => import('../features/redemptions/pages/AdvisorProducts'),
);
const CreateRoll = lazy(() => import('../features/dice/pages/CreateRoll'));
const RollHistory = lazy(() => import('../features/dice/pages/RollHistory'));
const RollDetail = lazy(() => import('../features/dice/pages/RollDetail'));
const ManagePrizes = lazy(() => import('../features/dice/pages/ManagePrizes'));
const Catalog = lazy(() => import('../features/catalog/pages/Catalog'));
const ManageRedeemables = lazy(
  () => import('../features/redeemable-products/pages/ManageRedeemables'),
);
const Zones = lazy(() => import('../features/zones/pages/Zones'));
const Loyalty = lazy(() => import('../features/settings/pages/Loyalty'));
const Users = lazy(() => import('../features/settings/pages/Users'));
const Profile = lazy(() => import('../features/settings/pages/Profile'));
const Rotation = lazy(() => import('../features/dashboard/pages/Rotation'));
const Audit = lazy(() => import('../features/audit/pages/Audit'));

function Guard({
  permission,
  children,
}: {
  permission: Permission;
  children: JSX.Element;
}): JSX.Element {
  const { user } = useAuth();
  return user && canSee(user.role, permission) ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}

/** Protege las rutas según sesión y cambio obligatorio. */
export function AppRouter(): JSX.Element {
  const { user, loading } = useAuth();
  const [navigationOpen, setNavigationOpen] = useState(false);
  if (loading) return <LoadingState label={copy.loading} />;
  if (!user) {
    return (
      <Suspense fallback={<LoadingState label={copy.loadingPage} />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }
  if (user.mustChangePassword) {
    return (
      <div className="account-shell">
        <Topbar />
        <Suspense fallback={<LoadingState label={copy.loadingPage} />}>
          <Routes>
            <Route path="/change-password" element={<ChangePassword />} />
            <Route
              path="*"
              element={<Navigate to="/change-password" replace />}
            />
          </Routes>
        </Suspense>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">
        {copy.skip}
      </a>
      <Sidebar
        open={navigationOpen}
        onNavigate={() => setNavigationOpen(false)}
      />
      <Topbar
        navigationOpen={navigationOpen}
        onToggleNavigation={() => setNavigationOpen(!navigationOpen)}
      />
      <main id="workspace" className="workspace" tabIndex={-1}>
        <Suspense fallback={<LoadingState label={copy.loadingPage} />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route
              path="/redemptions"
              element={
                <Guard permission="redemptions:read">
                  <RedemptionHistory />
                </Guard>
              }
            />
            <Route
              path="/redemptions/:id"
              element={
                <Guard permission="redemptions:read">
                  <RedemptionDetail />
                </Guard>
              }
            />
            <Route
              path="/redemptions/new"
              element={
                <Guard permission="redemptions:create">
                  <CreateRedemption />
                </Guard>
              }
            />
            <Route
              path="/advisor-products"
              element={
                <Guard permission="redeemable-products:read">
                  <AdvisorProducts />
                </Guard>
              }
            />
            <Route
              path="/dice/new"
              element={
                <Guard permission="dice:create">
                  <CreateRoll />
                </Guard>
              }
            />
            <Route
              path="/dice/rolls"
              element={
                <Guard permission="dice:read">
                  <RollHistory />
                </Guard>
              }
            />
            <Route
              path="/dice/rolls/:id"
              element={
                <Guard permission="dice:read">
                  <RollDetail />
                </Guard>
              }
            />
            <Route
              path="/dice/prizes"
              element={
                <Guard permission="dice-prizes:manage">
                  <ManagePrizes />
                </Guard>
              }
            />
            <Route
              path="/catalog"
              element={
                <Guard permission="catalog:read">
                  <Catalog />
                </Guard>
              }
            />
            <Route
              path="/redeemables"
              element={
                <Guard permission="redeemable-products:manage">
                  <ManageRedeemables />
                </Guard>
              }
            />
            <Route
              path="/zones"
              element={
                <Guard permission="zones:manage">
                  <Zones />
                </Guard>
              }
            />
            <Route
              path="/settings/loyalty"
              element={
                <Guard permission="settings:update">
                  <Loyalty />
                </Guard>
              }
            />
            <Route
              path="/users"
              element={
                <Guard permission="users:manage">
                  <Users />
                </Guard>
              }
            />
            <Route
              path="/profile"
              element={
                <Guard permission="profile:update">
                  <Profile />
                </Guard>
              }
            />
            <Route
              path="/rotation"
              element={
                <Guard permission="product-rotation:read">
                  <Rotation />
                </Guard>
              }
            />
            <Route
              path="/audit"
              element={
                <Guard permission="audit:read">
                  <Audit />
                </Guard>
              }
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <footer className="workspace-footer">
          {copy.footer}
          <span className="footer-palette" aria-hidden="true" />
        </footer>
      </main>
    </div>
  );
}
