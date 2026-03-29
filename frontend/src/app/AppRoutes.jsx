import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../MainLayout";
import Login from "../features/auth/Login";
import Register from "../features/auth/Register";
import Dashboard from "../features/dashboard/Dashboard";
import AttendanceHistory from "../pages/AttendanceHistory";
import { useState } from "react";
import RefreshHandler from "../components/ui/RefreshHandler";
import AdminUpload from "../pages/AdminUpload";

function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div>
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminUpload />} /> {/* ← no auth */}

        <Route element={<MainLayout setIsAuthenticated={setIsAuthenticated} />}>
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/history"
            element={isAuthenticated ? <AttendanceHistory /> : <Navigate to="/login" />}
          />
        </Route>
      </Routes>
    </div>
  );
}

export default AppRoutes;
