import {
  useEffect,
  useState,
} from "react";

import {
  createFollowUp,
  getAgents,
  getFollowUps,
  updateFollowUpStatus,
} from "../services/api";


function FollowUps() {
  const [records, setRecords] =
    useState([]);

  const [agents, setAgents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [processingId, setProcessingId] =
    useState(null);

  const [formError, setFormError] =
    useState("");

  const [form, setForm] = useState({
    agent_id: "",
    category: "Coaching",
    date: "",
    title: "",
    note: "",
    due_date: "",
  });


  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        followUpData,
        agentsData,
      ] = await Promise.all([
        getFollowUps(),
        getAgents(),
      ]);

      setRecords(
        followUpData.records || []
      );

      setAgents(
        agentsData.agents || []
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadData();
  }, []);


  function resetForm() {
    setForm({
      agent_id: "",
      category: "Coaching",
      date: "",
      title: "",
      note: "",
      due_date: "",
    });

    setFormError("");
  }


  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        agent_id: Number(
          form.agent_id
        ),
        category: form.category,
        date: form.date,
        title: form.title.trim(),
        note: form.note.trim(),
        due_date:
          form.due_date || null,
      };

      await createFollowUp(payload);

      setShowModal(false);
      resetForm();

      await loadData();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }


  async function handleStatusChange(
    record,
    newStatus
  ) {
    try {
      setProcessingId(record.id);

      await updateFollowUpStatus(
        record.id,
        newStatus
      );

      await loadData();
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  }


  const openCount = records.filter(
    (record) =>
      record.status === "Open"
  ).length;

  const completedCount =
    records.filter(
      (record) =>
        record.status === "Completed"
    ).length;

  const cancelledCount =
    records.filter(
      (record) =>
        record.status === "Cancelled"
    ).length;


  return (
    <>
      <header className="topbar">

        <div>
          <h2>Follow-ups</h2>

          <p>
            Track coaching, commitments
            and management actions
          </p>
        </div>


        <button
          className="primary-button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Follow-up
        </button>

      </header>


      <section className="dashboard-grid">

        <div className="stat-card">
          <span className="stat-label">
            Total
          </span>

          <strong>
            {loading
              ? "..."
              : records.length}
          </strong>

          <small>
            Recorded follow-ups
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Open
          </span>

          <strong>
            {loading
              ? "..."
              : openCount}
          </strong>

          <small>
            Pending actions
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Completed
          </span>

          <strong>
            {loading
              ? "..."
              : completedCount}
          </strong>

          <small>
            Closed successfully
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Cancelled
          </span>

          <strong>
            {loading
              ? "..."
              : cancelledCount}
          </strong>

          <small>
            Cancelled records
          </small>
        </div>

      </section>


      <section className="content-card">

        <div className="section-header">
          <div>
            <h3>
              Follow-up Records
            </h3>

            <p>
              Management notes and pending
              commitments
            </p>
          </div>
        </div>


        {loading && (
          <p className="message">
            Loading follow-ups...
          </p>
        )}


        {error && (
          <p className="message error-message">
            {error}
          </p>
        )}


        {!loading &&
          !error &&
          records.length === 0 && (
            <p className="message">
              No follow-ups found.
            </p>
          )}


        {!loading &&
          !error &&
          records.length > 0 && (
            <div className="table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map(
                    (record) => (
                      <tr key={record.id}>

                        <td>
                          <strong>
                            {record.agent_name}
                          </strong>
                        </td>

                        <td>
                          {record.date}
                        </td>

                        <td>
                          {record.category}
                        </td>

                        <td>
                          {record.title}
                        </td>

                        <td>
                          {record.due_date ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`status followup-${record.status.toLowerCase()}`}
                          >
                            {record.status}
                          </span>
                        </td>

                        <td>
                          {
                            record.created_by_admin
                          }
                        </td>

                        <td>

                          {record.status ===
                          "Open" ? (
                            <div className="overtime-actions">

                              <button
                                className="approve-button"
                                disabled={
                                  processingId ===
                                  record.id
                                }
                                onClick={() =>
                                  handleStatusChange(
                                    record,
                                    "Completed"
                                  )
                                }
                              >
                                Complete
                              </button>


                              <button
                                className="reject-button"
                                disabled={
                                  processingId ===
                                  record.id
                                }
                                onClick={() =>
                                  handleStatusChange(
                                    record,
                                    "Cancelled"
                                  )
                                }
                              >
                                Cancel
                              </button>

                            </div>
                          ) : (
                            <span className="decision-complete">
                              Closed
                            </span>
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
                  Add Follow-up
                </h3>

                <p>
                  Create a management
                  follow-up for an agent.
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
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label>Agent</label>

                <select
                  name="agent_id"
                  value={form.agent_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select agent
                  </option>

                  {agents.map(
                    (agent) => (
                      <option
                        key={agent.id}
                        value={agent.id}
                      >
                        {agent.first_name}{" "}
                        {agent.last_name}
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="form-row">

                <div className="form-group">
                  <label>
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={
                      handleChange
                    }
                  >
                    <option value="Coaching">
                      Coaching
                    </option>

                    <option value="Performance">
                      Performance
                    </option>

                    <option value="Quality">
                      Quality
                    </option>

                    <option value="Attendance">
                      Attendance
                    </option>

                    <option value="Behavior">
                      Behavior
                    </option>

                    <option value="Commitment">
                      Commitment
                    </option>

                    <option value="General">
                      General
                    </option>
                  </select>
                </div>


                <div className="form-group">
                  <label>Date</label>

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

              </div>


              <div className="form-group">

                <label>Title</label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Weekly coaching follow-up"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Due date
                </label>

                <input
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={
                    handleChange
                  }
                />

              </div>


              <div className="form-group">

                <label>Note</label>

                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Describe the action, discussion or commitment..."
                  required
                />

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
                    ? "Saving..."
                    : "Add Follow-up"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </>
  );
}


export default FollowUps;