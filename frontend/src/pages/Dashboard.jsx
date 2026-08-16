import { useEffect, useState } from "react";

import {
  getAgents,
  getFollowUps,
  getOvertimeRequests,
} from "../services/api";


function Dashboard() {
  const [agents, setAgents] =
    useState([]);

  const [overtime, setOvertime] =
    useState([]);

  const [followUps, setFollowUps] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          agentsData,
          overtimeData,
          followUpsData,
        ] = await Promise.all([
          getAgents(),
          getOvertimeRequests(),
          getFollowUps(),
        ]);

        setAgents(
          agentsData.agents || []
        );

        setOvertime(
          overtimeData.requests || []
        );

        setFollowUps(
          followUpsData.records || []
        );

      } catch (err) {
        setError(err.message);

      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);


  const activeAgents =
    agents.filter(
      (agent) =>
        agent.status &&
        agent.status.toLowerCase() ===
          "active"
    ).length;


  const pendingOvertime =
    overtime.filter(
      (request) =>
        request.status === "Pending"
    ).length;


  const openFollowUps =
    followUps.filter(
      (record) =>
        record.status === "Open"
    ).length;


  return (
    <>
      <header className="topbar">

        <div>
          <h2>
            Dashboard
          </h2>

          <p>
            Support operations overview
          </p>
        </div>

      </header>


      {error && (
        <p className="message error-message">
          {error}
        </p>
      )}


      <section className="dashboard-grid">

        <div className="stat-card">

          <span className="stat-label">
            Total Agents
          </span>

          <strong>
            {loading
              ? "..."
              : agents.length}
          </strong>

          <small>
            Registered agents
          </small>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Active Agents
          </span>

          <strong>
            {loading
              ? "..."
              : activeAgents}
          </strong>

          <small>
            Currently active
          </small>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Pending Overtime
          </span>

          <strong>
            {loading
              ? "..."
              : pendingOvertime}
          </strong>

          <small>
            Awaiting approval
          </small>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Open Follow-ups
          </span>

          <strong>
            {loading
              ? "..."
              : openFollowUps}
          </strong>

          <small>
            Pending actions
          </small>

        </div>

      </section>
    </>
  );
}


export default Dashboard;