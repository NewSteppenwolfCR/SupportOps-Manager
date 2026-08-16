import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import "./Overtime.css";

import {
  getOvertimeRequests,
  approveOvertime,
  rejectOvertime,
  deleteOvertime,
} from "../services/api";


function Overtime() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const [agentFilter, setAgentFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");


  const loadOvertime = async () => {
    try {
      setLoading(true);

      const data =
        await getOvertimeRequests();

      setRequests(
        data.requests || []
      );

      setError("");

    } catch (err) {
      setError(err.message);

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadOvertime();
  }, []);


  const handleApprove = async (
    request
  ) => {
    const comment = window.prompt(
      "Optional admin comment:",
      request.admin_comment || ""
    );

    if (comment === null) {
      return;
    }

    try {
      setProcessingId(request.id);

      await approveOvertime(
        request.id,
        comment
      );

      await loadOvertime();

    } catch (err) {
      setError(err.message);

    } finally {
      setProcessingId(null);
    }
  };


  const handleReject = async (
    request
  ) => {
    const comment = window.prompt(
      "Reason for rejection:",
      request.admin_comment || ""
    );

    if (comment === null) {
      return;
    }

    try {
      setProcessingId(request.id);

      await rejectOvertime(
        request.id,
        comment
      );

      await loadOvertime();

    } catch (err) {
      setError(err.message);

    } finally {
      setProcessingId(null);
    }
  };

    const handleDelete = async (
    request
  ) => {
    const confirmed = window.confirm(
      `Delete this overtime request for ${request.agent_name} on ${request.date}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(request.id);
      setError("");

      await deleteOvertime(
        request.id
      );

      await loadOvertime();

    } catch (err) {
      setError(err.message);

    } finally {
      setProcessingId(null);
    }
  };

  const agentOptions = [
    ...new Set(
      requests
        .map(
          (request) =>
            request.agent_name
        )
        .filter(Boolean)
    ),
  ].sort();


  const filteredRequests =
    requests.filter(
      (request) => {
        const matchesAgent =
          agentFilter === "All" ||
          request.agent_name ===
            agentFilter;

        const matchesStatus =
          statusFilter === "All" ||
          request.status ===
            statusFilter;

        const matchesFrom =
          !dateFrom ||
          request.date >= dateFrom;

        const matchesTo =
          !dateTo ||
          request.date <= dateTo;

        return (
          matchesAgent &&
          matchesStatus &&
          matchesFrom &&
          matchesTo
        );
      }
    );


  const clearFilters = () => {
    setAgentFilter("All");
    setStatusFilter("All");
    setDateFrom("");
    setDateTo("");
  };


  const pendingCount =
    filteredRequests.filter(
      (request) =>
        request.status === "Pending"
    ).length;


  const rejectedCount =
    filteredRequests.filter(
      (request) =>
        request.status === "Rejected"
    ).length;


  const approvedHours =
    filteredRequests
      .filter(
        (request) =>
          request.status ===
          "Approved"
      )
      .reduce(
        (total, request) =>
          total +
          Number(
            request.total_hours || 0
          ),
        0
      );


  const handleExportExcel = () => {
    if (
      filteredRequests.length === 0
    ) {
      window.alert(
        "There are no overtime records to export."
      );

      return;
    }


    const exportRows =
      filteredRequests.map(
        (request) => ({
          Agent:
            request.agent_name,

          Date:
            request.date,

          "Start Time":
            request.start_time,

          "End Time":
            request.end_time,

          "Total Hours":
            Number(
              request.total_hours || 0
            ),

          Justification:
            request.justification,

          Status:
            request.status,

          "Admin Comment":
            request.admin_comment || "",

          "Created At":
            request.created_at || "",
        })
      );


    const totalApprovedHours =
      filteredRequests
        .filter(
          (request) =>
            request.status ===
            "Approved"
        )
        .reduce(
          (total, request) =>
            total +
            Number(
              request.total_hours || 0
            ),
          0
        );


    exportRows.push({});


    exportRows.push({
      Agent: "SUMMARY",
      Status: "Approved Hours",
      "Total Hours":
        Number(
          totalApprovedHours.toFixed(2)
        ),
    });


    const worksheet =
      XLSX.utils.json_to_sheet(
        exportRows
      );


    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 13 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 38 },
      { wch: 14 },
      { wch: 38 },
      { wch: 22 },
    ];


    const range =
      XLSX.utils.decode_range(
        worksheet["!ref"]
      );


    for (
      let row = range.s.r + 1;
      row <= range.e.r;
      row++
    ) {
      const hoursCell =
        worksheet[
          XLSX.utils.encode_cell({
            r: row,
            c: 4,
          })
        ];

      if (
        hoursCell &&
        typeof hoursCell.v ===
          "number"
      ) {
        hoursCell.z = "0.00";
      }
    }


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Overtime Report"
    );


    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    XLSX.writeFile(
      workbook,
      `SupportOps_Overtime_Report_${today}.xlsx`
    );
  };


  return (
    <>
      <header className="topbar">

        <div>
          <h2>
            Overtime
          </h2>

          <p>
            Review and manage overtime
            requests
          </p>
        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={
            handleExportExcel
          }
          disabled={
            loading ||
            filteredRequests.length ===
              0
          }
        >
          Export to Excel
        </button>

      </header>


      {error && (
        <p className="message error-message">
          {error}
        </p>
      )}


      <section className="dashboard-grid">

        <div className="stat-card">

          <span className="stat-label">
            Total Requests
          </span>

          <strong>
            {loading
              ? "..."
              : filteredRequests.length}
          </strong>

          <small>
            Matching overtime requests
          </small>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Pending
          </span>

          <strong>
            {loading
              ? "..."
              : pendingCount}
          </strong>

          <small>
            Awaiting review
          </small>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Approved Hours
          </span>

          <strong>
            {loading
              ? "..."
              : approvedHours.toFixed(
                  2
                )}
          </strong>

          <small>
            Approved overtime in view
          </small>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Rejected
          </span>

          <strong>
            {loading
              ? "..."
              : rejectedCount}
          </strong>

          <small>
            Rejected requests
          </small>

        </div>

      </section>


      <section className="content-card">

        <div className="overtime-filters">

          <div className="filter-field">

            <label>
              Agent
            </label>

            <select
              value={agentFilter}
              onChange={(event) =>
                setAgentFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All agents
              </option>

              {agentOptions.map(
                (agent) => (
                  <option
                    key={agent}
                    value={agent}
                  >
                    {agent}
                  </option>
                )
              )}
            </select>

          </div>


          <div className="filter-field">

            <label>
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All statuses
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="Rejected">
                Rejected
              </option>

            </select>

          </div>


          <div className="filter-field">

            <label>
              From
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(
                  event.target.value
                )
              }
            />

          </div>


          <div className="filter-field">

            <label>
              To
            </label>

            <input
              type="date"
              value={dateTo}
              onChange={(event) =>
                setDateTo(
                  event.target.value
                )
              }
            />

          </div>


          <button
            type="button"
            className="secondary-button filter-clear"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>


        <div className="section-header">

          <div>
            <h3>
              Overtime Requests
            </h3>

            <p>
              Review submitted overtime
              records
            </p>
          </div>

        </div>


        {loading && (
          <p className="message">
            Loading overtime requests...
          </p>
        )}


        {!loading &&
          !error &&
          filteredRequests.length ===
            0 && (
            <p className="message">
              No overtime records match
              the selected filters.
            </p>
          )}


        {!loading &&
          !error &&
          filteredRequests.length >
            0 && (
            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>
                      Agent
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Time
                    </th>

                    <th>
                      Hours
                    </th>

                    <th>
                      Justification
                    </th>

                    <th>
                      Status
                    </th>

                                            <td>

                          <div className="overtime-actions">

                            {request.status ===
                            "Pending" ? (
                              <>
                                <button
                                  className="approve-button"
                                  disabled={
                                    processingId ===
                                    request.id
                                  }
                                  onClick={() =>
                                    handleApprove(
                                      request
                                    )
                                  }
                                >
                                  Approve
                                </button>


                                <button
                                  className="reject-button"
                                  disabled={
                                    processingId ===
                                    request.id
                                  }
                                  onClick={() =>
                                    handleReject(
                                      request
                                    )
                                  }
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="decision-complete">
                                Reviewed
                              </span>
                            )}


                            <button
                              type="button"
                              className="danger-button"
                              disabled={
                                processingId ===
                                request.id
                              }
                              onClick={() =>
                                handleDelete(
                                  request
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>
                  </tr>
                </thead>


                <tbody>

                  {filteredRequests.map(
                    (request) => (
                      <tr
                        key={
                          request.id
                        }
                      >

                        <td>
                          <strong>
                            {
                              request.agent_name
                            }
                          </strong>
                        </td>


                        <td>
                          {
                            request.date
                          }
                        </td>


                        <td>
                          {
                            request.start_time
                          }
                          {" - "}
                          {
                            request.end_time
                          }
                        </td>


                        <td>
                          {Number(
                            request.total_hours ||
                              0
                          ).toFixed(
                            2
                          )}
                        </td>


                        <td>
                          {
                            request.justification
                          }
                        </td>


                        <td>
                          <span
                            className={
                              `status overtime-${request.status.toLowerCase()}`
                            }
                          >
                            {
                              request.status
                            }
                          </span>
                        </td>


                        <td>

                          {request.status ===
                          "Pending" ? (

                            <div className="overtime-actions">

                              <button
                                className="approve-button"
                                disabled={
                                  processingId ===
                                  request.id
                                }
                                onClick={() =>
                                  handleApprove(
                                    request
                                  )
                                }
                              >
                                Approve
                              </button>


                              <button
                                className="reject-button"
                                disabled={
                                  processingId ===
                                  request.id
                                }
                                onClick={() =>
                                  handleReject(
                                    request
                                  )
                                }
                              >
                                Reject
                              </button>

                            </div>

                          ) : (

                            <span className="decision-complete">
                              Reviewed
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
    </>
  );
}


export default Overtime;