import { useState } from "react";

import {
  agentPortalLogin,
  createOvertimeRequest,
} from "../services/api";


function AgentPortal() {
  // =======================================================
  // AUTHENTICATION
  // =======================================================

  const [accessCode, setAccessCode] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [agent, setAgent] = useState(null);

  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);


  // =======================================================
  // OVERTIME FORM
  // =======================================================

  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    justification: "",
  });

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);


  // =======================================================
  // LOGIN
  // =======================================================

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoggingIn(true);
      setLoginError("");

      const data = await agentPortalLogin(
        accessCode
      );

      setAgent(data.agent);
      setAccessToken(data.access_token);
      setAccessCode("");
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoggingIn(false);
    }
  }


  // =======================================================
  // FORM CHANGE
  // =======================================================

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }


  // =======================================================
  // SUBMIT OVERTIME
  // =======================================================

  async function handleSubmitOvertime(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError("");
      setSuccessMessage("");

      // IMPORTANT:
      // We DO NOT send agent_id anymore.
      // FastAPI obtains the agent identity
      // directly from the signed JWT.
      const payload = {
        date: form.date,
        start_time: `${form.start_time}:00`,
        end_time: `${form.end_time}:00`,
        justification: form.justification,
      };

      const data = await createOvertimeRequest(
        payload,
        accessToken
      );

      setSuccessMessage(
        `Overtime submitted successfully: ${data.overtime.total_hours} hours`
      );

      setForm({
        date: "",
        start_time: "",
        end_time: "",
        justification: "",
      });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }


  // =======================================================
  // LOGOUT
  // =======================================================

  function handleLogout() {
    setAgent(null);
    setAccessToken("");
    setAccessCode("");

    setLoginError("");
    setFormError("");
    setSuccessMessage("");

    setForm({
      date: "",
      start_time: "",
      end_time: "",
      justification: "",
    });
  }


  // =======================================================
  // LOGIN SCREEN
  // =======================================================

  if (!agent) {
    return (
      <div className="portal-login-page">
        <div className="portal-login-card">
          <div className="portal-logo">
            S
          </div>

          <h1>SupportOps</h1>

          <p className="portal-subtitle">
            Agent Portal
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>
                Personal Access Code
              </label>

              <input
                type="password"
                inputMode="numeric"
                maxLength="6"
                value={accessCode}
                onChange={(event) => {
                  const numericCode =
                    event.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setAccessCode(numericCode);
                }}
                placeholder="Enter your 6-digit code"
                required
              />
            </div>

            {loginError && (
              <div className="form-error">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="
                primary-button
                portal-login-button
              "
              disabled={
                loggingIn ||
                accessCode.length !== 6
              }
            >
              {loggingIn
                ? "Signing in..."
                : "Access Portal"}
            </button>
          </form>

          <p className="portal-security-note">
            Use your personal SupportOps
            access code.
          </p>
        </div>
      </div>
    );
  }


  // =======================================================
  // AUTHENTICATED AGENT PORTAL
  // =======================================================

  return (
    <>
      <header className="topbar">
        <div>
          <h2>Agent Portal</h2>

          <p>
            Welcome, {agent.first_name}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </header>


      <section className="agent-welcome-card">
        <div className="profile-avatar">
          {agent.first_name.charAt(0)}
          {agent.last_name.charAt(0)}
        </div>

        <div>
          <h3>
            {agent.first_name}{" "}
            {agent.last_name}
          </h3>

          <p>{agent.email}</p>

          <span>
            Schedule: {agent.schedule}
          </span>
        </div>
      </section>


      <section className="portal-grid">
        <div className="content-card">
          <div className="section-header">
            <div>
              <h3>Submit Overtime</h3>

              <p>
                Record additional hours worked
              </p>
            </div>
          </div>


          <form
            className="
              agent-form
              portal-form
            "
            onSubmit={
              handleSubmitOvertime
            }
          >
            <div className="form-group">
              <label>Date</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={
                  handleFormChange
                }
                required
              />
            </div>


            <div className="form-row">
              <div className="form-group">
                <label>
                  Start time
                </label>

                <input
                  type="time"
                  name="start_time"
                  value={
                    form.start_time
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                />
              </div>


              <div className="form-group">
                <label>
                  End time
                </label>

                <input
                  type="time"
                  name="end_time"
                  value={
                    form.end_time
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                />
              </div>
            </div>


            <div className="form-group">
              <label>
                Justification
              </label>

              <textarea
                name="justification"
                value={
                  form.justification
                }
                onChange={
                  handleFormChange
                }
                placeholder="
                  Reason for overtime...
                "
                rows="4"
                required
              />
            </div>


            {formError && (
              <div className="form-error">
                {formError}
              </div>
            )}


            {successMessage && (
              <div className="portal-success">
                {successMessage}
              </div>
            )}


            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit Overtime"}
            </button>
          </form>
        </div>


        <div className="content-card">
          <div className="section-header">
            <div>
              <h3>My Information</h3>

              <p>
                Current agent details
              </p>
            </div>
          </div>


          <div className="profile-details">
            <div>
              <span>Name</span>

              <strong>
                {agent.first_name}{" "}
                {agent.last_name}
              </strong>
            </div>


            <div>
              <span>Email</span>

              <strong>
                {agent.email}
              </strong>
            </div>


            <div>
              <span>Schedule</span>

              <strong>
                {agent.schedule}
              </strong>
            </div>


            <div>
              <span>Status</span>

              <strong>
                {agent.status}
              </strong>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


export default AgentPortal;