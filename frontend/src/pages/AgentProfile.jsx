import {
  useEffect,
  useState,
} from "react";

import {
  deleteAgent,
  downloadReportAttachment,
  generateAgentAccessCode,
  getAgent,
  getAgentAttendance,
  getAgentFollowUps,
  getAgentOvertime,
  getAgentReports,
  getAgentTimeOff,
  updateAgentStatus,
} from "../services/api";


function AgentProfile({
  agentId,
  onBack,
}) {
  const [agent, setAgent] =
    useState(null);

  const [attendance, setAttendance] =
    useState({
      summary: {
        tardiness: 0,
        permissions: 0,
        total: 0,
      },
      records: [],
    });

  const [followUps, setFollowUps] =
    useState({
      summary: {
        open: 0,
        completed: 0,
        cancelled: 0,
        total: 0,
      },
      records: [],
    });

  const [overtime, setOvertime] =
    useState({
      total: 0,
      requests: [],
    });

  const [timeOff, setTimeOff] =
    useState({
      summary: {
        total_records: 0,
        total_days: 0,
        vacation_days: 0,
        sick_days: 0,
      },
      records: [],
    });

  const [reports, setReports] =
    useState({
      total: 0,
      reports: [],
    });

  const [activeTab, setActiveTab] =
    useState("Overview");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [accessCode, setAccessCode] =
    useState("");

  const [
    showAccessCodeModal,
    setShowAccessCodeModal,
  ] = useState(false);

  const [
    generatingCode,
    setGeneratingCode,
  ] = useState(false);

  const [
    accessCodeError,
    setAccessCodeError,
  ] = useState("");


  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const [
          agentData,
          attendanceData,
          followUpData,
          overtimeData,
          timeOffData,
          reportsData,
        ] = await Promise.all([
          getAgent(agentId),
          getAgentAttendance(agentId),
          getAgentFollowUps(agentId),
          getAgentOvertime(agentId),
          getAgentTimeOff(agentId),
          getAgentReports(agentId),
        ]);

        setAgent(agentData);
        setAttendance(attendanceData);
        setFollowUps(followUpData);
        setOvertime(overtimeData);
        setTimeOff(timeOffData);
        setReports(reportsData);

      } catch (error) {
        setError(error.message);

      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [agentId]);


  async function handleOpenAttachment(
    attachment
  ) {
    try {
      setError("");

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


  async function handleGenerateAccessCode() {
    if (!agent) {
      return;
    }

    const confirmed = window.confirm(
      "Generate a new access code for this agent? Any previous access code will stop working."
    );

    if (!confirmed) {
      return;
    }

    try {
      setGeneratingCode(true);
      setAccessCodeError("");

      const data =
        await generateAgentAccessCode(
          agent.id
        );

      setAccessCode(
        data.access_code
      );

      setShowAccessCodeModal(true);

    } catch (error) {
      setAccessCodeError(
        error.message
      );

    } finally {
      setGeneratingCode(false);
    }
  }


  async function handleCopyAccessCode() {
    try {
      await navigator.clipboard.writeText(
        accessCode
      );

    } catch {
      window.prompt(
        "Copy this access code:",
        accessCode
      );
    }
  }

  async function handleToggleAgentStatus() {
  if (!agent) {
    return;
  }

  const newStatus =
    agent.status === "Active"
      ? "Inactive"
      : "Active";

  const action =
    newStatus === "Inactive"
      ? "deactivate"
      : "reactivate";

  const confirmed = window.confirm(
    `Are you sure you want to ${action} ${agent.first_name} ${agent.last_name}?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");

    const data = await updateAgentStatus(
      agent.id,
      newStatus
    );

    setAgent(data.agent);

  } catch (error) {
    setError(error.message);
  }
}


async function handleDeleteAgent() {
  if (!agent) {
    return;
  }

  const confirmed = window.confirm(
    `Permanently delete ${agent.first_name} ${agent.last_name}? This is only allowed if the agent has no historical records.`
  );

  if (!confirmed) {
    return;
  }

  const finalConfirmation = window.confirm(
    "This action cannot be undone. Continue?"
  );

  if (!finalConfirmation) {
    return;
  }

  try {
    setError("");

    await deleteAgent(agent.id);

    onBack();

  } catch (error) {
    setError(error.message);
  }
}


  if (loading) {
    return (
      <p className="message">
        Loading agent...
      </p>
    );
  }


  if (error) {
    return (
      <p className="message error-message">
        {error}
      </p>
    );
  }


  if (!agent) {
    return null;
  }


  const approvedOvertimeHours =
    (overtime.requests || [])
      .filter(
        (request) =>
          request.status === "Approved"
      )
      .reduce(
        (total, request) =>
          total +
          Number(
            request.total_hours || 0
          ),
        0
      );


  const tabs = [
    "Overview",
    "Attendance",
    "Overtime",
    "Vacations",
    "Follow-ups",
    "Reports",
  ];


  return (
    <>
      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Agents
      </button>


      <header className="agent-profile-header">

        <div className="profile-avatar">
          {agent.first_name.charAt(0)}
          {agent.last_name.charAt(0)}
        </div>


        <div className="profile-title">

          <div className="profile-name-row">

            <h2>
              {agent.first_name}{" "}
              {agent.last_name}
            </h2>


            <span
              className={
                agent.status.toLowerCase() ===
                "active"
                  ? "status active-status"
                  : "status inactive-status"
              }
            >
              {agent.status}
            </span>

          </div>


          <p>
            {agent.email}
          </p>

          <span>
            {agent.schedule}
          </span>

        </div>


        <div className="profile-access-actions">

  <button
    type="button"
    className="secondary-button"
    onClick={
      handleGenerateAccessCode
    }
    disabled={generatingCode}
  >
    {generatingCode
      ? "Generating..."
      : "Generate Access Code"}
  </button>


  <button
    type="button"
    className={
      agent.status === "Active"
        ? "secondary-button"
        : "primary-button"
    }
    onClick={
      handleToggleAgentStatus
    }
  >
    {agent.status === "Active"
      ? "Deactivate Agent"
      : "Reactivate Agent"}
  </button>


  {agent.status === "Inactive" && (
    <button
      type="button"
      className="danger-button"
      onClick={
        handleDeleteAgent
      }
    >
      Delete Permanently
    </button>
  )}


  {accessCodeError && (
    <span className="access-code-error">
      {accessCodeError}
    </span>
  )}

</div>

      </header>


      <div className="profile-tabs">

        {tabs.map((tab) => (
          <button
            key={tab}
            className={
              activeTab === tab
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              setActiveTab(tab)
            }
          >
            {tab}
          </button>
        ))}

      </div>


      {activeTab === "Overview" && (
        <section className="profile-grid">

          <div className="content-card profile-card">

            <div className="section-header">
              <div>
                <h3>
                  Agent Information
                </h3>

                <p>
                  General profile information
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


          <div className="content-card profile-card">

            <div className="section-header">
              <div>
                <h3>
                  Activity Summary
                </h3>

                <p>
                  Agent operational activity
                </p>
              </div>
            </div>


            <div className="activity-summary">

              <div>
                <strong>
                  {
                    attendance.summary
                      .tardiness
                  }
                </strong>

                <span>
                  Tardies
                </span>
              </div>


              <div>
                <strong>
                  {
                    attendance.summary
                      .permissions
                  }
                </strong>

                <span>
                  Permissions
                </span>
              </div>


              <div>
                <strong>
                  {approvedOvertimeHours.toFixed(
                    2
                  )}
                  h
                </strong>

                <span>
                  Overtime
                </span>
              </div>


              <div>
                <strong>
                  {
                    followUps.summary
                      .open
                  }
                </strong>

                <span>
                  Follow-ups
                </span>
              </div>

            </div>

          </div>

        </section>
      )}


      {activeTab === "Attendance" && (
        <section className="content-card">

          <div className="section-header">
            <div>
              <h3>
                Attendance History
              </h3>

              <p>
                Manual attendance records
                for this agent
              </p>
            </div>
          </div>


          {attendance.records.length ===
          0 ? (
            <p className="message">
              No attendance records
              found for this agent.
            </p>
          ) : (
            <div className="table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Minutes</th>
                    <th>Reference</th>
                    <th>Note</th>
                    <th>Created By</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance.records.map(
                    (record) => (
                      <tr key={record.id}>

                        <td>
                          {record.date}
                        </td>

                        <td>
                          {record.record_type}
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
      )}


      {activeTab === "Overtime" && (
        <section className="content-card">

          <div className="section-header">
            <div>
              <h3>
                Overtime History
              </h3>

              <p>
                Overtime requests for
                this agent
              </p>
            </div>
          </div>


          {(overtime.requests || [])
            .length === 0 ? (
            <p className="message">
              No overtime records
              found for this agent.
            </p>
          ) : (
            <div className="table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Justification</th>
                  </tr>
                </thead>

                <tbody>
                  {overtime.requests.map(
                    (request) => (
                      <tr key={request.id}>

                        <td>
                          {request.date}
                        </td>

                        <td>
                          {request.start_time}
                          {" - "}
                          {request.end_time}
                        </td>

                        <td>
                          {Number(
                            request.total_hours
                          ).toFixed(2)}
                        </td>

                        <td>
                          {request.status}
                        </td>

                        <td>
                          {
                            request.justification
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
      )}


      {activeTab === "Vacations" && (
        <>
          <section className="dashboard-grid">

            <div className="stat-card">
              <span className="stat-label">
                Records
              </span>

              <strong>
                {
                  timeOff.summary
                    .total_records
                }
              </strong>

              <small>
                Time off entries
              </small>
            </div>


            <div className="stat-card">
              <span className="stat-label">
                Total Days
              </span>

              <strong>
                {
                  timeOff.summary
                    .total_days
                }
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
                {
                  timeOff.summary
                    .vacation_days
                }
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
                {
                  timeOff.summary
                    .sick_days
                }
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
                  Historical records from
                  Bamboo HR
                </p>
              </div>
            </div>


            {timeOff.records.length ===
            0 ? (
              <p className="message">
                No time off records found
                for this agent.
              </p>
            ) : (
              <div className="table-wrapper">

                <table>
                  <thead>
                    <tr>
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
                    {timeOff.records.map(
                      (record) => (
                        <tr key={record.id}>

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
        </>
      )}


      {activeTab === "Follow-ups" && (
        <section className="content-card">

          <div className="section-header">
            <div>
              <h3>
                Follow-up History
              </h3>

              <p>
                Coaching and management
                actions for this agent
              </p>
            </div>
          </div>


          {followUps.records.length ===
          0 ? (
            <p className="message">
              No follow-ups found
              for this agent.
            </p>
          ) : (
            <div className="table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Created By</th>
                  </tr>
                </thead>

                <tbody>
                  {followUps.records.map(
                    (record) => (
                      <tr key={record.id}>

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
                          {record.status}
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
      )}


      {activeTab === "Reports" && (
        <section className="content-card">

          <div className="section-header">
            <div>
              <h3>
                Documentation Records
              </h3>

              <p>
                Feedback, notes and
                supporting documentation
                for this agent
              </p>
            </div>
          </div>


          {(reports.reports || [])
            .length === 0 ? (
            <p className="message">
              No documentation records
              found for this agent.
            </p>
          ) : (
            <div className="table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Note</th>
                    <th>Attachments</th>
                    <th>Created By</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.reports.map(
                    (report) => (
                      <tr key={report.id}>

                        <td>
                          {report.date}
                        </td>

                        <td>
                          {report.category}
                        </td>

                        <td>
                          <strong>
                            {report.title}
                          </strong>
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

                      </tr>
                    )
                  )}
                </tbody>
              </table>

            </div>
          )}

        </section>
      )}


      {showAccessCodeModal && (
        <div
          className="modal-overlay"
          onMouseDown={() =>
            setShowAccessCodeModal(false)
          }
        >

          <div
            className="modal access-code-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h3>
                  Agent Access Code
                </h3>

                <p>
                  Share this code with{" "}
                  {agent.first_name}{" "}
                  {agent.last_name}.
                </p>
              </div>


              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setShowAccessCodeModal(
                    false
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="access-code-content">

              <span className="access-code-label">
                Access Code
              </span>


              <div className="access-code-value">
                {accessCode}
              </div>


              <p className="access-code-note">
                Generating another code will
                replace this one. The agent
                uses this code to sign in to
                the Agent Portal.
              </p>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    handleCopyAccessCode
                  }
                >
                  Copy Code
                </button>


                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    setShowAccessCodeModal(
                      false
                    )
                  }
                >
                  Done
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </>
  );
}


export default AgentProfile;