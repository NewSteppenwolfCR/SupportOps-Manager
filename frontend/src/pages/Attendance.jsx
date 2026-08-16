import { useEffect, useState } from "react";

import {
  createAttendanceRecord,
  getAgents,
  getAttendanceRecords,
} from "../services/api";


function Attendance() {
  const [records, setRecords] = useState([]);
  const [agents, setAgents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    agent_id: "",
    record_type: "Tardiness",
    date: "",
    minutes: "",
    reference: "Attendance Bot",
    note: "",
  });


  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        attendanceData,
        agentsData,
      ] = await Promise.all([
        getAttendanceRecords(),
        getAgents(),
      ]);

      setRecords(
        attendanceData.records || []
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


  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  function resetForm() {
    setForm({
      agent_id: "",
      record_type: "Tardiness",
      date: "",
      minutes: "",
      reference: "Attendance Bot",
      note: "",
    });

    setFormError("");
  }


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        agent_id: Number(form.agent_id),
        record_type: form.record_type,
        date: form.date,
        minutes:
          form.minutes === ""
            ? null
            : Number(form.minutes),
        reference:
          form.reference.trim() || null,
        note: form.note.trim(),
      };

      await createAttendanceRecord(
        payload
      );

      setShowModal(false);
      resetForm();

      await loadData();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }


  const tardinessCount = records.filter(
    (record) =>
      record.record_type === "Tardiness"
  ).length;

  const permissionsCount = records.filter(
    (record) =>
      record.record_type === "Permission"
  ).length;

  const absenceCount = records.filter(
    (record) =>
      record.record_type === "Absence"
  ).length;


  return (
    <>
      <header className="topbar">
        <div>
          <h2>Attendance</h2>

          <p>
            Manual attendance tracking and
            supervisor notes
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Record
        </button>
      </header>


      <section className="dashboard-grid">

        <div className="stat-card">
          <span className="stat-label">
            Total Records
          </span>

          <strong>
            {loading
              ? "..."
              : records.length}
          </strong>

          <small>
            Recorded attendance events
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Tardiness
          </span>

          <strong>
            {loading
              ? "..."
              : tardinessCount}
          </strong>

          <small>
            Logged late arrivals
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Permissions
          </span>

          <strong>
            {loading
              ? "..."
              : permissionsCount}
          </strong>

          <small>
            Logged permissions
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Absences
          </span>

          <strong>
            {loading
              ? "..."
              : absenceCount}
          </strong>

          <small>
            Logged absences
          </small>
        </div>

      </section>


      <section className="content-card">

        <div className="section-header">
          <div>
            <h3>
              Attendance Records
            </h3>

            <p>
              Records manually documented
              by management
            </p>
          </div>
        </div>


        {loading && (
          <p className="message">
            Loading attendance records...
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
              No attendance records found.
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
                    <th>Type</th>
                    <th>Minutes</th>
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
                            {record.agent_name}
                          </strong>
                        </td>

                        <td>
                          {record.date}
                        </td>

                        <td>
                          <span className="status">
                            {record.record_type}
                          </span>
                        </td>

                        <td>
                          {record.minutes ??
                            "—"}
                        </td>

                        <td>
                          {record.reference ||
                            "—"}
                        </td>

                        <td>
                          {record.note}
                        </td>

                        <td>
                          {record.created_by_admin}
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
                  Add Attendance Record
                </h3>

                <p>
                  Document an attendance
                  event manually.
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
                    Record type
                  </label>

                  <select
                    name="record_type"
                    value={
                      form.record_type
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="Tardiness">
                      Tardiness
                    </option>

                    <option value="Permission">
                      Permission
                    </option>

                    <option value="Absence">
                      Absence
                    </option>

                    <option value="Early Leave">
                      Early Leave
                    </option>

                    <option value="Schedule Exception">
                      Schedule Exception
                    </option>

                    <option value="Other">
                      Other
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


              <div className="form-row">

                <div className="form-group">
                  <label>
                    Minutes
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="minutes"
                    value={form.minutes}
                    onChange={
                      handleChange
                    }
                    placeholder="Optional"
                  />
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
                    placeholder="Attendance Bot"
                  />
                </div>

              </div>


              <div className="form-group">

                <label>Note</label>

                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Add context or supervisor notes..."
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


export default Attendance;