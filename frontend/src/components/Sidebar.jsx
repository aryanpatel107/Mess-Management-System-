import { NavLink, useNavigate } from "react-router-dom";
import { getUser, logout } from "../auth";

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();

  const userName = user?.name || "User";
  const userRole = user?.role || "User";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const allNavItems = [
    { to: "/app", label: "Dashboard", roles: ["Admin", "Staff", "User"] },
    { to: "/app/profile", label: "Profile", roles: ["Admin", "Staff", "User"] },
    { to: "/app/menu", label: "Menu", roles: ["Admin", "Staff", "User"] },
    { to: "/app/attendance", label: "Attendance", roles: ["Admin", "Staff", "User"] },
    { to: "/app/complaints", label: "Complaints", roles: ["Admin", "Staff", "User"] },
    { to: "/app/notifications", label: "Notifications", roles: ["Admin", "Staff", "User"] },
    { to: "/app/billing", label: "Billing", roles: ["Admin", "Staff", "User"] },
    { to: "/app/inventory", label: "Inventory", roles: ["Admin", "Staff"] },
    { to: "/app/admin-users", label: "Manage Users", roles: ["Admin", "Staff"] },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <header className="topbar">
      {/* 🔥 LEFT (LOGO + USER) */}
      <div className="topbarLeft">
        <div className="brandBlock">
          <div className="brandIcon">🍽</div>

          <div className="brandText">
            <div className="brandTitle">MESS</div>
            <div className="brandSubtext">
              {userName} ({userRole})
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 CENTER MENU */}
      <nav className="navMenu">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app"}
            className={({ isActive }) =>
              isActive ? "navItem active" : "navItem"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* 🔥 RIGHT */}
      <div className="topbarRight">
        <NavLink
          to="/app/help-centre"
          className={({ isActive }) =>
            isActive ? "helpTopBtn active" : "helpTopBtn"
          }
        >
          🛟 Help
        </NavLink>

        <button className="logoutBtn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}