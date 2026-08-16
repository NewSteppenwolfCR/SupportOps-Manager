import { useState } from "react";

import Sidebar from "../components/Sidebar";

import Dashboard from "./Dashboard";
import Agents from "./Agents";
import AgentProfile from "./AgentProfile";
import Overtime from "./Overtime";
import Attendance from "./Attendance";
import FollowUps from "./FollowUps";
import Vacations from "./Vacations";
import Reports from "./Reports";
import Administrators from "./Administrators";


function AdminApp({
  admin,
  onLogout,
}) {
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [
    selectedAgentId,
    setSelectedAgentId,
  ] = useState(null);


  function navigate(page) {
    setSelectedAgentId(null);
    setActivePage(page);
  }


  function openAgent(agentId) {
    setSelectedAgentId(agentId);
    setActivePage("AgentProfile");
  }


  function renderPage() {
    if (
      activePage === "AgentProfile" &&
      selectedAgentId
    ) {
      return (
        <AgentProfile
          agentId={selectedAgentId}
          onBack={() =>
            navigate("Agents")
          }
        />
      );
    }


    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;

      case "Agents":
        return (
          <Agents
            onOpenAgent={openAgent}
          />
        );

      case "Overtime":
        return <Overtime />;

      case "Attendance":
        return <Attendance />;

      case "Vacations":
        return <Vacations />;

      case "Follow-ups":
        return <FollowUps />;

        case "Reports":
  return <Reports />;

      default:
        return (
          <div>
            <h2>{activePage}</h2>

            <p>
              This module is coming soon.
            </p>
          </div>
        );
        
        case "Reports":
  return <Reports />;

case "Administrators":
  return (
    <Administrators
      currentAdmin={admin}
    />
  );
    }
  }
  


  return (
    <div className="app-shell">

      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
      />


      <main className="main-content">

        <div className="admin-session-bar">

          <div>
            <span className="admin-session-label">
              Signed in as
            </span>

            <strong>
              {admin?.first_name}{" "}
              {admin?.last_name}
            </strong>
          </div>


          <button
            type="button"
            className="secondary-button"
            onClick={onLogout}
          >
            Sign Out
          </button>

        </div>


        {renderPage()}

      </main>

    </div>
  );
}


export default AdminApp;