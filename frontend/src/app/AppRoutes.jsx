import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import MainLayout from "../MainLayout";
import Login from "../features/auth/Login";
import Register from "../features/auth/Register";
import Dashboard from "../features/dashboard/Dashboard";
import AttendanceHistory from "../pages/AttendanceHistory";
import RefreshHandler from "../components/ui/RefreshHandler";
import AdminUpload from "../pages/AdminUpload";

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
    Checking session...
  </div>
);

const ProtectedRoute = ({ authState, allowedRoles, children }) => {
  if (!authState.isReady) {
    return <LoadingScreen />;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(authState.user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ authState, children }) => {
  if (!authState.isReady) {
    return <LoadingScreen />;
  }

  if (authState.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    isReady: false,
  });

  return (
    <div>
      <RefreshHandler setAuthState={setAuthState} />
      <Routes>
        <Route
          path="/"
          element={
            authState.isReady ? (
              <Navigate to={authState.isAuthenticated ? "/dashboard" : "/login"} replace />
            ) : (
              <LoadingScreen />
            )
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute authState={authState}>
              <Login setAuthState={setAuthState} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute authState={authState}>
              <Register />
            </PublicOnlyRoute>
          }
        />

        <Route element={<MainLayout setAuthState={setAuthState} />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute authState={authState}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute authState={authState}>
                <AttendanceHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute authState={authState} allowedRoles={["admin"]}>
                <AdminUpload />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </div>
  );
}

export default AppRoutes;
