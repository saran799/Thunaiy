import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';

/** Route guard: every flow screen beyond registration requires a session. */
export default function RequireAuth() {
  const { isAuthenticated } = useAppState();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/register" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
