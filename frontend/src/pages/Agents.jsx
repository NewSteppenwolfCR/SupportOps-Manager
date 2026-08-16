import { useEffect, useState } from "react";
import { getAgents, createAgent } from "../services/api";

function Agents({ onOpenAgent }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAgentModal, setShowAgentModal] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  const [formError, setFormError] = useState("");

  const [newAgent, setNewAgent] = useState({
    first_name: "",
    last_name: "",
    email: "",
    schedule: "",
    status: "Active",
  });

  const loadAgents = async () => {
    try {
      setLoading(true);

      const data = await getAgents();

      setAgents(data.agents);
      setError("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setNewAgent((previousAgent) => ({
      ...previousAgent,
      [name]: value,
    }));
  };

  const handleAddAgent = async (event) => {
    event.preventDefault();

    try {
      setSavingAgent(true);
      setFormError("");

      await createAgent(newAgent);

      await loadAgents();

      setNewAgent({
        first_name: "",
        last_name: "",
        email: "",
        schedule: "",
        status: "Active",
      });

      setShowAgentModal(false);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSavingAgent(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h2>Agents</h2>
          <p>Manage support team members</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setFormError("");
            setShowAgentModal(true);
          }}
        >
          + Add Agent
        </button>
      </header>

      <section className="content-card">
        <div className="section-header">
          <div>
            <h3>Support Team</h3>
            <p>{agents.length} registered agents</p>
          </div>
        </div>

        {loading && (
          <p className="message">
            Loading agents...
          </p>
        )}

        {error && (
          <p className="message error-message">
            Error loading agents: {error}
          </p>
        )}

        {!loading && !error && agents.length === 0 && (
          <p className="message">
            No agents found.
          </p>
        )}

        {!loading && !error && agents.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Schedule</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="clickable-row"
                    onClick={() => onOpenAgent(agent.id)}
                  >
                    <td>
                      <div className="agent-name">
                        <div className="agent-avatar">
                          {agent.first_name.charAt(0)}
                          {agent.last_name.charAt(0)}
                        </div>

                        <div>
                          <strong>
                            {agent.first_name}{" "}
                            {agent.last_name}
                          </strong>

                          <span>
                            Agent #{agent.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{agent.email}</td>

                    <td>{agent.schedule}</td>

                    <td>
                      <span
                        className={
                          agent.status.toLowerCase() === "active"
                            ? "status active-status"
                            : "status inactive-status"
                        }
                      >
                        {agent.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAgentModal && (
        <div
          className="modal-overlay"
          onMouseDown={() => setShowAgentModal(false)}
        >
          <div
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Add Agent</h3>
                <p>
                  Register a new support agent.
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setShowAgentModal(false)}
              >
                ×
              </button>
            </div>

            <form
              className="agent-form"
              onSubmit={handleAddAgent}
            >
              <div className="form-row">
                <div className="form-group">
                  <label>First name</label>

                  <input
                    type="text"
                    name="first_name"
                    value={newAgent.first_name}
                    onChange={handleInputChange}
                    placeholder="Carlos"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last name</label>

                  <input
                    type="text"
                    name="last_name"
                    value={newAgent.last_name}
                    onChange={handleInputChange}
                    placeholder="Ramirez"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={newAgent.email}
                  onChange={handleInputChange}
                  placeholder="agent@company.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Schedule</label>

                <input
                  type="text"
                  name="schedule"
                  value={newAgent.schedule}
                  onChange={handleInputChange}
                  placeholder="06:00-15:00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Status</label>

                <select
                  name="status"
                  value={newAgent.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
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
                  onClick={() => setShowAgentModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingAgent}
                >
                  {savingAgent
                    ? "Saving..."
                    : "Add Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Agents;