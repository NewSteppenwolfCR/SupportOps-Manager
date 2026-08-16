import {
  useEffect,
  useState,
} from "react";

import {
  createTimeOffRecord,
  getAgents,
  getTimeOffRecords,
} from "../services/api";


function Vacations() {
  const [records, setRecords] = useState([]);
  const [agents, setAgents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [form, setForm] = useState({
    agent_id: "",
    start_date: "",
    end_date: "",
    leave_type: "Vacation",
    reference: "Bamboo HR",
    note: "",
  });


  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        timeOffData,
        agentsData,
      ] = await Promise.all([
        getTimeOffRecords(),
        getAgents(),
      ]);

      setRecords(
        timeOffData.records || []
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
      start_date: "",
      end_date: "",
      leave_type: "Vacation",
      reference: "Bamboo HR",
      note: "",
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

      if (
        form.end_date <
        form.start_date
      ) {
        throw new Error(
          "End date cannot be earlier than start date"
        );
      }

      await createTimeOffRecord({
        agent_id: Number(
          form.agent_id
        ),
        start_date:
          form.start_date,
        end_date:
          form.end_date,
        leave_type:
          form.leave_type,
        reference:
          form.reference.trim() ||
          "Bamboo HR",
        note:
          form.note.trim() ||
          null,
      });

      setShowModal(false);
      resetForm();

      await loadData();

    } catch (error) {
      setFormError(error.message);

    } finally {
      setSaving(false);
    }
  }


  const vacationDays =
    records
      .filter(
        (record) =>
          record.leave_type ===
          "Vacation"
      )
      .reduce(
        (total, record) =>
          total +
          Number(
            record.total_days || 0
          ),
        0
      );


  const sickDays =
    records
      .filter(
        (record) =>
          record.leave_type ===
          "Sick Leave"
      )
      .reduce(
        (total, record) =>
          total +
          Number(
            record.total_days || 0
          ),
        0
      );


  const totalDays =
    records.reduce(
      (total, record) =>
        total +
        Number(
          record.total_days || 0
        ),
      0
    );


  return (
    <>
      <header className="topbar">

        <div>
          <h2>Vacations</h2>

          <p>
            Time off history recorded
            from Bamboo HR
          </p>
        </div>


        <button
          className="primary-button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Time Off
        </button>

      </header>


      <section className="dashboard-grid">

        <div className="stat-card">
          <span className="stat-label">
            Records
          </span>

          <strong>
            {loading
              ? "..."
              : records.length}
          </strong>

          <small>
            Time off records
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Total Days
          </span>

          <strong>
            {loading
              ? "..."
              : totalDays}
          </strong>

          <small>
            All recorded time off
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Vacation
          </span>

          <strong>
            {loading
              ? "..."
              : vacationDays}
          </strong>

          <small>
            Vacation days
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Sick Leave
          </span>

          <strong>
            {loading
              ? "..."
              : sickDays}
          </strong>

          <small>
            Sick leave days
          </small>
        </div>

      </section>


      <section className="content-card">

        <div className="section-header">

          <div>
            <h3>
              Time Off History
            </h3>

            <p>
              Historical leave records.
              Bamboo HR remains the
              official source.
            </p>
          </div>

        </div>


        {loading && (
          <p className="message">
            Loading time off records...
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
              No time off records found.
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
                    <th>Type</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Days</th>
                    <th>Reference</th>
                    <th>Note</th>
                    <th>Created By</th>
                  </tr>
                </thead>


                <tbody>

                  {records.map(
                    (record) => (
                      <tr key={record.id}>

                        <td>
                          <strong>
                            {
                              record.agent_name
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            record.leave_type
                          }
                        </td>

                        <td>
                          {
                            record.start_date
                          }
                        </td>

                        <td>
                          {
                            record.end_date
                          }
                        </td>

                        <td>
                          {
                            record.total_days
                          }
                        </td>

                        <td>
                          {
                            record.reference ||
                            "—"
                          }
                        </td>

                        <td>
                          {
                            record.note ||
                            "—"
                          }
                        </td>

                        <td>
                          {
                            record.created_by_admin
                          }
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
                  Add Time Off
                </h3>

                <p>
                  Register historical
                  information from
                  Bamboo HR.
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


              <div className="form-group">

                <label>
                  Leave Type
                </label>

                <select
                  name="leave_type"
                  value={form.leave_type}
                  onChange={handleChange}
                >

                  <option value="Vacation">
                    Vacation
                  </option>

                  <option value="Sick Leave">
                    Sick Leave
                  </option>

                  <option value="Personal Leave">
                    Personal Leave
                  </option>

                  <option value="Unpaid Leave">
                    Unpaid Leave
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label>
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="start_date"
                    value={
                      form.start_date
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    End Date
                  </label>

                  <input
                    type="date"
                    name="end_date"
                    value={
                      form.end_date
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Reference
                </label>

                <input
                  type="text"
                  name="reference"
                  value={
                    form.reference
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Bamboo HR"
                />

              </div>


              <div className="form-group">

                <label>Note</label>

                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Optional management note..."
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
                    : "Add Record"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </>
  );
}


export default Vacations;