import {
  useEffect,
  useState,
} from "react";

import {
  createReport,
  deleteReport,
  downloadReportAttachment,
  getAgents,
  getReports,
} from "../services/api";


function Reports() {
  const [reports, setReports] =
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

  const [formError, setFormError] =
    useState("");

  const [selectedFiles, setSelectedFiles] =
    useState([]);

  const [form, setForm] = useState({
    agent_id: "",
    category: "Quality Feedback",
    report_date: "",
    title: "",
    note: "",
  });


  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        reportsData,
        agentsData,
      ] = await Promise.all([
        getReports(),
        getAgents(),
      ]);

      setReports(
        reportsData.reports || []
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
      category: "Quality Feedback",
      report_date: "",
      title: "",
      note: "",
    });

    setSelectedFiles([]);
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


  function handleFiles(event) {
    const files = Array.from(
      event.target.files || []
    );

    setSelectedFiles(files);
  }


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      const formData = new FormData();

      formData.append(
        "agent_id",
        form.agent_id
      );

      formData.append(
        "category",
        form.category
      );

      formData.append(
        "report_date",
        form.report_date
      );

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "note",
        form.note.trim()
      );

      selectedFiles.forEach(
        (file) => {
          formData.append(
            "files",
            file
          );
        }
      );

      await createReport(formData);

      setShowModal(false);
      resetForm();

      await loadData();

    } catch (error) {
      setFormError(error.message);

    } finally {
      setSaving(false);
    }
  }


  async function handleOpenAttachment(
    attachment
  ) {
    try {
      const blob =
        await downloadReportAttachment(
          attachment.id
        );

      const url =
        URL.createObjectURL(blob);

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);

    } catch (error) {
      setError(error.message);
    }
  }

    async function handleDeleteReport(
    report
  ) {
    const confirmed = window.confirm(
      `Delete report "${report.title}" for ${report.agent_name}? This will also delete its attachments.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteReport(
        report.id
      );

      await loadData();

    } catch (error) {
      setError(error.message);
    }
  }

  const attachmentCount =
    reports.reduce(
      (total, report) =>
        total +
        (
          report.attachments
            ?.length || 0
        ),
      0
    );


  return (
    <>
      <header className="topbar">

        <div>
          <h2>Reports</h2>

          <p>
            Agent documentation,
            feedback and supporting
            evidence
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
            Records
          </span>

          <strong>
            {loading
              ? "..."
              : reports.length}
          </strong>

          <small>
            Documented records
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Attachments
          </span>

          <strong>
            {loading
              ? "..."
              : attachmentCount}
          </strong>

          <small>
            Supporting files
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Agents
          </span>

          <strong>
            {loading
              ? "..."
              : new Set(
                  reports.map(
                    (report) =>
                      report.agent_id
                  )
                ).size}
          </strong>

          <small>
            Agents with records
          </small>
        </div>


        <div className="stat-card">
          <span className="stat-label">
            Storage
          </span>

          <strong>
            Local
          </strong>

          <small>
            Development environment
          </small>
        </div>

      </section>


      <section className="content-card">

        <div className="section-header">

          <div>
            <h3>
              Documentation Records
            </h3>

            <p>
              Manual notes and evidence
              linked to agents
            </p>
          </div>

        </div>


        {loading && (
          <p className="message">
            Loading reports...
          </p>
        )}


        {error && (
          <p className="message error-message">
            {error}
          </p>
        )}


        {!loading &&
          !error &&
          reports.length === 0 && (
            <p className="message">
              No reports found.
            </p>
          )}


        {!loading &&
          !error &&
          reports.length > 0 && (
            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Note</th>
                    <th>Files</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>


                <tbody>

                  {reports.map(
                    (report) => (
                      <tr key={report.id}>

                        <td>
                          <strong>
                            {
                              report.agent_name
                            }
                          </strong>
                        </td>

                        <td>
                          {report.date}
                        </td>

                        <td>
                          {report.category}
                        </td>

                        <td>
                          {report.title}
                        </td>

                        <td>
                          {report.note ||
                            "—"}
                        </td>

                        <td>
                          {report.attachments
                            ?.length ? (
                            <div className="report-files">

                              {report.attachments.map(
                                (
                                  attachment
                                ) => (
                                  <button
                                    key={
                                      attachment.id
                                    }
                                    type="button"
                                    className="attachment-button"
                                    onClick={() =>
                                      handleOpenAttachment(
                                        attachment
                                      )
                                    }
                                  >
                                    {
                                      attachment.original_filename
                                    }
                                  </button>
                                )
                              )}

                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                         {
                           report.created_by_admin
                                                 }
                        </td>

                        <td>
                            <button
                             type="button"
                             className="danger-button"
                             onClick={() =>
                                handleDeleteReport(
                                               report
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
            className="modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h3>
                  Add Documentation
                </h3>

                <p>
                  Add a manual note and
                  optional supporting files.
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
                    <option value="Written Warning">
                      Written Warning
                    </option>

                    <option value="Quality Feedback">
                      Quality Feedback
                    </option>

                    <option value="Customer Feedback">
                      Customer Feedback
                    </option>

                    <option value="Performance Note">
                      Performance Note
                    </option>

                    <option value="Email Record">
                      Email Record
                    </option>

                    <option value="HR Document">
                      HR Document
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
                    name="report_date"
                    value={
                      form.report_date
                    }
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
                  placeholder="Quality feedback - August"
                  required
                />

              </div>


              <div className="form-group">

                <label>Note</label>

                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Add context, summary or relevant details..."
                />

              </div>


              <div className="form-group">

                <label>
                  Attachments
                </label>

                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  multiple
                  onChange={handleFiles}
                />

                <small className="upload-help">
                  PDF, PNG, JPG or JPEG.
                  Maximum 10 MB per file.
                </small>

              </div>


              {selectedFiles.length > 0 && (
                <div className="selected-files">

                  {selectedFiles.map(
                    (file) => (
                      <div
                        key={`${file.name}-${file.size}`}
                      >
                        {file.name}
                      </div>
                    )
                  )}

                </div>
              )}


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


export default Reports;