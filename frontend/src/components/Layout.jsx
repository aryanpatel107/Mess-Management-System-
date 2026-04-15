import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="appLayout">
      <Sidebar />
      <main className="mainContent">
        <Outlet />
      </main>
    </div>
  );
}