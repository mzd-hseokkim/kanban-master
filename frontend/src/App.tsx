import { CommandPalette } from '@/components/common/CommandPalette';
import { KeyboardShortcutsHelp } from '@/components/common/KeyboardShortcutsHelp';
import { ConnectionStatusScanner } from '@/components/ConnectionStatusScanner';
import { Footer } from '@/components/Footer';
import { GlobalNavBar } from '@/components/GlobalNavBar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { BoardProvider } from '@/context/BoardContext';
import { CardProvider } from '@/context/CardContext';
import { ColumnProvider } from '@/context/ColumnContext';
import { DialogProvider } from '@/context/DialogContext';
import { SprintProvider } from '@/context/SprintContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import AuditLogPage from '@/pages/AuditLogPage';
import BoardDetailPage from '@/pages/BoardDetailPage';
import BoardsPage from '@/pages/BoardsPage';
import ContactPage from '@/pages/ContactPage';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import OAuth2CallbackHandler from '@/pages/OAuth2CallbackHandler';
import PricingPage from '@/pages/PricingPage';
import PrivacyPage from '@/pages/PrivacyPage';
import ProfilePage from '@/pages/ProfilePage';
import SearchPage from '@/pages/SearchPage';
import { SignupPage } from '@/pages/SignupPage';
import TermsPage from '@/pages/TermsPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { Fragment, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

const AUTH_CHROME_EXCLUDED_PATHS = ['/login', '/signup', '/verify-email', '/oauth2/callback'];

const App = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [prevLocation, setPrevLocation] = useState(location);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isAuthenticated } = useAuth();
  const shouldShowAppChrome = isAuthenticated && !AUTH_CHROME_EXCLUDED_PATHS.includes(location.pathname);

  useEffect(() => {
    if (location !== displayLocation) {
      setPrevLocation(displayLocation);
      setDisplayLocation(location);
      setIsAnimating(true);
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    setIsAnimating(false);
    setPrevLocation(location);
  };

  const routes = (
    <Fragment>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/oauth2/callback" element={<OAuth2CallbackHandler />} />
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
      <Route
        path="/profile"
        element={(
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/privacy"
        element={(
          <ProtectedRoute>
            <PrivacyPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/terms"
        element={(
          <ProtectedRoute>
            <TermsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/contact"
        element={(
          <ProtectedRoute>
            <ContactPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/pricing"
        element={(
          <ProtectedRoute>
            <PricingPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/search"
        element={(
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/audit-logs"
        element={(
          <ProtectedRoute>
            <AuditLogPage />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Fragment>
  );

  return (
    <DialogProvider>
      <WebSocketProvider>
        <BoardProvider>
        <ColumnProvider>
          <CardProvider>
            <SprintProvider>
            <div className="min-h-screen bg-gradient-pastel flex flex-col">
              <ConnectionStatusScanner />
              {shouldShowAppChrome && <GlobalNavBar />}
              <div className="flex-1 relative min-h-0 overflow-hidden">
                {isAnimating && prevLocation && (
                  <div className="page-transition-wrapper fadeOut" onAnimationEnd={handleAnimationEnd}>
                    <Routes location={prevLocation}>
                      {routes}
                    </Routes>
                  </div>
                )}
                <div className={`page-transition-wrapper ${isAnimating ? 'fadeIn' : ''}`}>
                  <Routes location={displayLocation}>
                    {routes}
                  </Routes>
                </div>
              </div>
              {shouldShowAppChrome && <Footer />}
            </div>
            <CommandPalette />
            <KeyboardShortcutsHelp />
            </SprintProvider>
          </CardProvider>
        </ColumnProvider>
        </BoardProvider>
      </WebSocketProvider>
    </DialogProvider>
  );
};

export default App;
