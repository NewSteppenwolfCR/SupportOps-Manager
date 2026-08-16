import {
  useEffect,
  useState,
} from "react";

import {
  changeAdminPassword,
  createAdmin,
  deleteAdmin,
  getAdmins,
  updateAdminStatus,
} from "../services/api";


function Administrators({
  currentAdmin,
}) {
  const [admins, setAdmins] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [processingId, setProcessingId] =
    useState(null);

  const [showModal, setShowModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });


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


  async function loadAdmins() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdmins();

      setAdmins(
        data.admins || []
      );

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadAdmins();
  }, []);


  function resetCreateForm() {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
    });

    setFormError("");
  }


  function handleCreateChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  async function handleCreateAdmin(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      if (
        form.password !==
        form.confirm_password
      ) {
        throw new Error(
          "Passwords do not match"
        );
      }

      if (form.password.length < 10) {
        throw new Error(
          "Password must contain at least 10 characters"
        );
      }

      await createAdmin({
        first_name:
          form.first_name.trim(),

        last_name:
          form.last_name.trim(),

        email:
          form.email.trim(),

        password:
          form.password,
      });

      setShowModal(false);
      resetCreateForm();

      await loadAdmins();

    } catch (error) {
      setFormError(error.message);

    } finally {
      setSaving(false);
    }
  }


  async function handleStatusChange(
    admin
  ) {
    const newStatus =
      admin.status === "Active"
        ? "Inactive"
        : "Active";

    const action =
      newStatus === "Inactive"
        ? "deactivate"
        : "reactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${admin.first_name} ${admin.last_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(admin.id);
      setError("");

      await updateAdminStatus(
        admin.id,
        newStatus
      );

      await loadAdmins();

    } catch (error) {
      setError(error.message);

    } finally {
      setProcessingId(null);
    }
  }


  async function handleDeleteAdmin(
    admin
  ) {
    const confirmed = window.confirm(
      `Permanently delete ${admin.first_name} ${admin.last_name}?`
    );

    if (!confirmed) {
      return;
    }

    const finalConfirmation =
      window.confirm(
        "This action cannot be undone. Continue?"
      );

    if (!finalConfirmation) {
      return;
    }

    try {
      setProcessingId(admin.id);
      setError("");

      await deleteAdmin(
        admin.id
      );

      await loadAdmins();

    } catch (error) {
      setError(error.message);

    } finally {
      setProcessingId(null);
    }
  }


  function handlePasswordChange(event) {
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


  async function handleChangePassword(
    event
  ) {
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


  const activeAdmins =
    admins.filter(
      (admin) =>
        admin.status === "Active"
    ).length;


  return (
    <>
      <header className="topbar">

        <div>
          <h2>Administrators</h2>

          <p>
            Manage administrator access
            and account security
          </p>
        </div>


        <button
          type="button"
          className="primary-button"
          onClick={() => {
            resetCreateForm();
            setShowModal(true);
          }}
        >
          + Add Administrator
        </button>

      </header>


      <section className="dashboard-grid">

        <div className="stat-card">
          <span className="stat-label">
            Administrators
          </span>

          <strong>
            {loading
              ? "..."
              : admins.length}
          </strong>

          <small>
            Total administrator accounts
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Active
          </span>

          <strong>
            {loading
              ? "..."
              : activeAdmins}
          </strong>

          <small>
            Active administrator accounts
          </small>
        </div>

      </section>


      <section className="content-card">

        <div className="section-header">
          <div>
            <h3>
              Administrator Accounts
            </h3>

            <p>
              Manage access to SupportOps
              Manager
            </p>
          </div>
        </div>


        {loading && (
          <p className="message">
            Loading administrators...
          </p>
        )}


        {error && (
          <p className="message error-message">
            {error}
          </p>
        )}


        {!loading &&
          !error &&
          admins.length === 0 && (
            <p className="message">
              No administrators found.
            </p>
          )}


        {!loading &&
          !error &&
          admins.length > 0 && (

            <div className="table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {admins.map(
                    (admin) => (

                      <tr key={admin.id}>

                        <td>
                          <strong>
                            {admin.first_name}{" "}
                            {admin.last_name}
                          </strong>

                          {admin.id ===
                            currentAdmin?.id && (
                            <span>
                              {" "} (You)
                            </span>
                          )}
                        </td>


                        <td>
                          {admin.email}
                        </td>


                        <td>
                          <span
                            className={
                              admin.status ===
                              "Active"
                                ? "status active-status"
                                : "status inactive-status"
                            }
                          >
                            {admin.status}
                          </span>
                        </td>


                        <td>
                          {admin.created_at
                            ? new Date(
                                admin.created_at
                              ).toLocaleDateString()
                            : "—"}
                        </td>


                        <td>

                          {admin.id ===
                          currentAdmin?.id ? (

                            <span className="decision-complete">
                              Current Account
                            </span>

                          ) : (

                            <div className="overtime-actions">

                              <button
                                type="button"
                                className={
                                  admin.status ===
                                  "Active"
                                    ? "danger-button"
                                    : "secondary-button"
                                }
                                disabled={
                                  processingId ===
                                  admin.id
                                }
                                onClick={() =>
                                  handleStatusChange(
                                    admin
                                  )
                                }
                              >
                                {admin.status ===
                                "Active"
                                  ? "Deactivate"
                                  : "Reactivate"}
                              </button>


                              {admin.status ===
                                "Inactive" && (

                                <button
                                  type="button"
                                  className="danger-button"
                                  disabled={
                                    processingId ===
                                    admin.id
                                  }
                                  onClick={() =>
                                    handleDeleteAdmin(
                                      admin
                                    )
                                  }
                                >
                                  Delete Permanently
                                </button>

                              )}

                            </div>

                          )}

                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>

            </div>
          )}

      </section>


      <section className="content-card">

        <div className="section-header">
          <div>
            <h3>
              Change My Password
            </h3>

            <p>
              Update the password for your
              administrator account
            </p>
          </div>
        </div>


        <form
          className="agent-form"
          onSubmit={
            handleChangePassword
          }
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
              onChange={
                handlePasswordChange
              }
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
                onChange={
                  handlePasswordChange
                }
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
                onChange={
                  handlePasswordChange
                }
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


      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={() =>
            setShowModal(false)
          }
        >

          <div
            className="modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h3>
                  Add Administrator
                </h3>

                <p>
                  Create a new SupportOps
                  administrator account.
                </p>
              </div>


              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              className="agent-form"
              onSubmit={
                handleCreateAdmin
              }
            >

              <div className="form-row">

                <div className="form-group">
                  <label>
                    First Name
                  </label>

                  <input
                    type="text"
                    name="first_name"
                    value={
                      form.first_name
                    }
                    onChange={
                      handleCreateChange
                    }
                    required
                  />
                </div>


                <div className="form-group">
                  <label>
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="last_name"
                    value={
                      form.last_name
                    }
                    onChange={
                      handleCreateChange
                    }
                    required
                  />
                </div>

              </div>


              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={
                    handleCreateChange
                  }
                  required
                />
              </div>


              <div className="form-row">

                <div className="form-group">
                  <label>Password</label>

                  <input
                    type="password"
                    name="password"
                    value={
                      form.password
                    }
                    onChange={
                      handleCreateChange
                    }
                    minLength="10"
                    required
                  />
                </div>


                <div className="form-group">
                  <label>
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    name="confirm_password"
                    value={
                      form.confirm_password
                    }
                    onChange={
                      handleCreateChange
                    }
                    minLength="10"
                    required
                  />
                </div>

              </div>


              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Creating..."
                    : "Create Administrator"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </>
  );
}


export default Administrators;