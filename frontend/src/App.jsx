import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useState } from "react";

import "./App.css";

import AdminApp from "./pages/AdminApp";
import AdminLogin from "./pages/AdminLogin";
import AgentPortal from "./pages/AgentPortal";

import {
  clearAdminSession,
  getAdminSession,
} from "./services/api";


function App() {
  const [adminSession, setAdminSession] = useState(
    getAdminSession()
  );

  function handleAdminLogin(admin) {
    setAdminSession(
      getAdminSession()
    );
  }

  function handleAdminLogout() {
    clearAdminSession();
    setAdminSession(null);
  }

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
            <Navigate
              to="/admin"
              replace
            />
          }
        />


        <Route
          path="/admin/login"
          element={
            adminSession ? (
              <Navigate
                to="/admin"
                replace
              />
            ) : (
              <AdminLogin
                onLoginSuccess={
                  handleAdminLogin
                }
              />
            )
          }
        />


        <Route
          path="/admin/*"
          element={
            adminSession ? (
              <AdminApp
                admin={
                  adminSession.admin
                }
                onLogout={
                  handleAdminLogout
                }
              />
            ) : (
              <Navigate
                to="/admin/login"
                replace
              />
            )
          }
        />


        <Route
          path="/portal"
          element={
            <AgentPortal />
          }
        />


        <Route
          path="*"
          element={
            <Navigate
              to="/admin"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}


export default App;