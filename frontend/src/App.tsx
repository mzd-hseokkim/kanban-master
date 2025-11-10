import { Fragment, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, type Location } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BoardProvider } from '@/context/BoardContext';
import { ColumnProvider } from '@/context/ColumnContext';
import { CardProvider } from '@/context/CardContext';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import BoardsPage from '@/pages/BoardsPage';
import BoardDetailPage from '@/pages/BoardDetailPage';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const TRANSITION_DURATION = 420;

const App = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [prevLocation, setPrevLocation] = useState<Location | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const isSamePath = location.pathname === displayLocation.pathname;
    const isSameSearch = location.search === displayLocation.search;

    if (!isSamePath || !isSameSearch) {
      setPrevLocation(displayLocation);
      setDisplayLocation(location);
      setIsTransitioning(true);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (!isTransitioning) {
      return undefined;
    }

    const duration = prefersReducedMotion ? 0 : TRANSITION_DURATION;
    const timeout = window.setTimeout(() => {
      setPrevLocation(null);
      setIsTransitioning(false);
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [isTransitioning, prefersReducedMotion]);

  const routes = (
    <Fragment>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/boards"
        element={(
          <ProtectedRoute>
            <BoardsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/boards/:workspaceId/:boardId"
        element={(
          <ProtectedRoute>
            <BoardDetailPage />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Fragment>
  );

  return (
    <BoardProvider>
      <ColumnProvider>
        <CardProvider>
          <div className={`page-transition-container${isTransitioning ? ' page-transition-container-active' : ''}`}>
            {prevLocation && (
              <div className="page-transition-layer page-transition-exit">
                <Routes location={prevLocation}>
                  {routes}
                </Routes>
              </div>
            )}
            <div
              className={`page-transition-layer${
                isTransitioning ? ' page-transition-enter' : ' page-transition-layer-static'
              }`}
            >
              <Routes
                location={displayLocation}
                key={`${displayLocation.pathname}${displayLocation.search}`}
              >
                {routes}
              </Routes>
            </div>
          </div>
        </CardProvider>
      </ColumnProvider>
    </BoardProvider>
  );
};

export default App;
