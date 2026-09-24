import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';
import { ToastProvider } from './ToastContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Kundlis from './pages/Kundlis.jsx';
import AiKeys from './pages/AiKeys.jsx';
import AiSettings from './pages/AiSettings.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kundlis"
              element={
                <ProtectedRoute>
                  <Kundlis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-keys"
              element={
                <ProtectedRoute>
                  <AiKeys />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-settings"
              element={
                <ProtectedRoute>
                  <AiSettings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
