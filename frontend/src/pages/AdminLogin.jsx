import { useState } from "react";

import {
  adminLogin,
  saveAdminSession,
} from "../services/api";


function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await adminLogin(
        email.trim(),
        password
      );

      saveAdminSession(data);

      if (onLoginSuccess) {
        onLoginSuccess(data.admin);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="auth-page">

      <div className="auth-wrapper">

        <div className="auth-brand">
          <div className="auth-logo">
            S
          </div>

          <h1>SupportOps</h1>

          <p>
            Management Portal
          </p>
        </div>


        <div className="auth-card">

          <div className="auth-card-icon">
            A
          </div>

          <h2>Welcome back</h2>

          <p className="auth-card-description">
            Sign in to access the management portal
          </p>


          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            <div className="auth-field">
              <label>Email</label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  @
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="admin@example.com"
                  autoComplete="username"
                  required
                />
              </div>
            </div>


            <div className="auth-field">
              <label>Password</label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  ●
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>


            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}


            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>


          <div className="auth-security-note">
            <span>◆</span>

            Authorized SupportOps
            administrators only.
          </div>

        </div>

      </div>

    </div>
  );
}


export default AdminLogin;