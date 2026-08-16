import {
  useState,
} from "react";

import {
  changeAdminPassword,
} from "../services/api";


function Settings({
  admin,
  onLogout,
}) {
  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);


  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setPasswordForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setChangingPassword(true);
      setPasswordError("");
      setPasswordMessage("");

      if (
        passwordForm.new_password !==
        passwordForm.confirm_password
      ) {
        throw new Error(
          "New passwords do not match"
        );
      }

      if (
        passwordForm.new_password.length <
        10
      ) {
        throw new Error(
          "New password must contain at least 10 characters"
        );
      }

      const data =
        await changeAdminPassword(
          passwordForm.current_password,
          passwordForm.new_password
        );

      setPasswordMessage(
        data.message ||
          "Password changed successfully"
      );

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

    } catch (error) {
      setPasswordError(
        error.message
      );

    } finally {
      setChangingPassword(false);
    }
  }


  return (
    <>
      <header className="topbar">

        <div>
          <h2>Settings</h2>

          <p>
            Account and security settings
          </p>
        </div>

      </header>


      <section className="content-card">

        <div className="section-header">
          <div>
            <h3>My Account</h3>

            <p>
              Current administrator account
            </p>
          </div>
        </div>


        <div className="profile-details">

          <div>
            <span>Name</span>

            <strong>
              {admin?.first_name}{" "}
              {admin?.last_name}
            </strong>
          </div>


          <div>
            <span>Email</span>

            <strong>
              {admin?.email}
            </strong>
          </div>


          <div>
            <span>Status</span>

            <strong>
              {admin?.status || "Active"}
            </strong>
          </div>

        </div>

      </section>


      <section className="content-card">

        <div className="section-header">
          <div>
            <h3>Security</h3>

            <p>
              Change your administrator password
            </p>
          </div>
        </div>


        <form
          className="agent-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label>
              Current Password
            </label>

            <input
              type="password"
              name="current_password"
              value={
                passwordForm.current_password
              }
              onChange={handleChange}
              required
            />
          </div>


          <div className="form-row">

            <div className="form-group">
              <label>
                New Password
              </label>

              <input
                type="password"
                name="new_password"
                value={
                  passwordForm.new_password
                }
                onChange={handleChange}
                minLength="10"
                required
              />
            </div>


            <div className="form-group">
              <label>
                Confirm New Password
              </label>

              <input
                type="password"
                name="confirm_password"
                value={
                  passwordForm.confirm_password
                }
                onChange={handleChange}
                minLength="10"
                required
              />
            </div>

          </div>


          {passwordError && (
            <div className="form-error">
              {passwordError}
            </div>
          )}


          {passwordMessage && (
            <p className="message">
              {passwordMessage}
            </p>
          )}


          <div className="modal-actions">

            <button
              type="submit"
              className="primary-button"
              disabled={
                changingPassword
              }
            >
              {changingPassword
                ? "Changing..."
                : "Change Password"}
            </button>

          </div>

        </form>

      </section>


      <section className="content-card">

        <div className="section-header">
          <div>
            <h3>Session</h3>

            <p>
              Manage your current session
            </p>
          </div>
        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={onLogout}
        >
          Sign Out
        </button>

      </section>

    </>
  );
}


export default Settings;