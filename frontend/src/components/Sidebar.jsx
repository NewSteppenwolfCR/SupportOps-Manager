function Sidebar({ activePage, onNavigate }) {
  const items = [
    "Dashboard",
    "Agents",
    "Overtime",
    "Attendance",
    "Vacations",
    "Follow-ups",
    "Reports",
    
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">S</div>

        <div>
          <h1>SupportOps</h1>
          <span>Manager</span>
        </div>
      </div>

      <nav className="nav-menu">
        {items.map((item) => (
          <button
            key={item}
            className={
              activePage === item
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => onNavigate(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className={
            activePage === "Settings"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() => onNavigate("Settings")}
        >
          Settings
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;