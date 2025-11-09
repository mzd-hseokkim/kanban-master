import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BoardProvider } from '@/context/BoardContext';
import { ColumnProvider } from '@/context/ColumnContext';
import { CardProvider } from '@/context/CardContext';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import BoardsPage from '@/pages/BoardsPage';
import BoardDetailPage from '@/pages/BoardDetailPage';

const App = () => {
  return (
    <BoardProvider>
      <ColumnProvider>
        <CardProvider>
          <Routes>
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
          </Routes>
        </CardProvider>
      </ColumnProvider>
    </BoardProvider>
  );
};

export default App;
