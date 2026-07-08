// The console frame every screen sits in: wordmark, nav, and the page
// outlet. Matches the header language from the design handoff.

import { NavLink, Outlet } from "react-router-dom";
import "./AppShell.css";

export default function AppShell() {
  return (
    <div className="shell">
      <header className="shell-header">
        <NavLink to="/" className="wordmark">
          AGORA<span className="wordmark-accent">_</span>
        </NavLink>
        <nav className="shell-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `shell-nav-link${isActive ? " active" : ""}`
            }
          >
            new debate
          </NavLink>
          <NavLink
            to="/debates"
            className={({ isActive }) =>
              `shell-nav-link${isActive ? " active" : ""}`
            }
          >
            replay gallery
          </NavLink>
        </nav>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
