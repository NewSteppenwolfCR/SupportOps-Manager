import {
  useEffect,
  useState,
} from "react";

import {
  createAttendanceRecord,
  deleteAttendanceRecord,
  getAgents,
  getAttendanceRecords,
} from "../services/api";


function Attendance() {
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

  const [formData, setFormData] =
    useState({
      agent_id: "",
      record_type: "Tardiness",
      date: "",
      minutes: "",
      reference: "",
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


  function resetForm() {
    setFormData({
      agent_id: "",
      record_type: "Tardiness",
      date: "",
      minutes: "",
      reference: "",
      note: "",
    });
  }


  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await createAttendanceRecord({
        agent_id:
          Number(formData.agent_id),

        record_type:
          formData.record_type,

        date:
          formData.date,

        minutes:
          formData.minutes === ""
            ? null
            : Number(formData.minutes),

        reference:
          formData.reference.trim()
            ? formData.reference.trim()
            : null,

        note:
          formData.note.trim(),
      });

      setShowModal(false);
      resetForm();

      await loadData();

    } catch (error) {
      setError(error.message);

    } finally {
      setSaving(false);
    }
  }


  async function handleDeleteRecord(
    record
  ) {
    const confirmed = window.confirm(
      `Delete this ${record.record_type} record for ${record.agent_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteAttendanceRecord(
        record.id
      );

      await loadData();

    } catch (error) {
      setError(error.message);
    }
  }


  const tardinessCount =
    records.filter(
      (record) =>
        record.record_type ===
        "Tardiness"
    ).length;


  const permissionsCount =
    records.filter(
      (record) =>
        record.record_type ===
        "Permission"
    ).length;


  const absenceCount =
    records.filter(
      (record) =>
        record.record_type ===
        "Absence"
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
                          <span className="status">
                            {record.record_type}
                          </span>
                        </td>


                        <td>
                          {record.minutes ?? "—"}
                        </td>


                        <td>
                          {record.reference || "—"}
                        </td>


                        <td>
                          {record.note}
                        </td>


                        <td>
                          {record.created_by_admin}
                        </td>


                        <td>
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              handleDeleteRecord(
                                record
                              )
                            }
                          >
                            Delete
                          </button>
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
            className="modal-card"
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
                  event for an agent.
                </p>
              </div>


              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              className="modal-form"
              onSubmit={handleSubmit}
            >

              <label>
                Agent

                <select
                  name="agent_id"
                  value={
                    formData.agent_id
                  }
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
              </label>


              <label>
                Record Type

                <select
                  name="record_type"
                  value={
                    formData.record_type
                  }
                  onChange={handleChange}
                  required
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
              </label>


              <label>
                Date

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </label>


              <label>
                Minutes

                <input
                  type="number"
                  min="0"
                  name="minutes"
                  value={
                    formData.minutes
                  }
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </label>


              <label>
                Reference

                <input
                  type="text"
                  name="reference"
                  value={
                    formData.reference
                  }
                  onChange={handleChange}
                  placeholder="Optional reference"
                />
              </label>


              <label>
                Note

                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Attendance details"
                  required
                />
              </label>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  disabled={saving}
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
                    : "Save Record"}
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