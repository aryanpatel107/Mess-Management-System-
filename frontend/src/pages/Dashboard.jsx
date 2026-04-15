import { getUser } from "../auth";
import api from "../api";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const u = getUser();

  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);

  const [todayMenu, setTodayMenu] = useState(null);
  const [attendance, setAttendance] = useState(null);

  const [inventoryCount, setInventoryCount] = useState(0);
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);

  const [activeCard, setActiveCard] = useState(null);
  const [search, setSearch] = useState("");

  // 🔥 UPDATED useEffect (WITH AUTO REFRESH)
  useEffect(() => {
    loadData();

    const refresh = () => loadData();
    window.addEventListener("refreshDashboard", refresh);

    return () => window.removeEventListener("refreshDashboard", refresh);
  }, []);

  async function loadData() {
    try {
      // 👑 ADMIN + STAFF
      if (u?.role === "Admin" || u?.role === "Staff") {
        const usersRes = await api.get("/users");
        setUsers(usersRes.data || []);

        const invRes = await api.get("/inventory");
        const invData = invRes.data || [];
        setInventory(invData);
        setInventoryCount(invData.length);

        const compRes = await api.get("/complaints");
        const compData = compRes.data || [];
        setComplaints(compData);
        setComplaintsCount(compData.length);

        const payRes = await api.get("/billing");
        const payData = payRes.data || [];
        setPayments(payData);

        const pending = payData.filter(p => p.status === "Pending");
        setPendingPayments(pending.length);
      }

      // 👤 USER
      else {
        const today = new Date().toISOString().split("T")[0];

        const menuRes = await api.get(`/menu/weekly/today?date=${today}`);
        setTodayMenu(menuRes.data);

        const attRes = await api.get("/attendance/today");
        setAttendance(attRes.data);

        const payRes = await api.get("/billing/my");
        setPayments(payRes.data || []);
      }

    } catch (err) {
      console.error(err);
    }
  }

  function filterData(data, fields) {
    return data.filter(item =>
      fields.some(field =>
        (item[field] || "")
          .toString()
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboardHeader">
        <h1>Dashboard</h1>
        <p>Welcome {u?.name} ({u?.role})</p>
      </div>

      {/* ================= ADMIN + STAFF ================= */}
      {(u?.role === "Admin" || u?.role === "Staff") && (
        <>
          <div className="statsGrid">

            <div className="statCard" onClick={() => setActiveCard("users")}>
              <h4>👤 Users</h4>
              <h2>{users.length}</h2>
            </div>

            <div className="statCard" onClick={() => setActiveCard("inventory")}>
              <h4>📦 Inventory</h4>
              <h2>{inventoryCount}</h2>
            </div>

            <div className="statCard" onClick={() => setActiveCard("complaints")}>
              <h4>📢 Complaints</h4>
              <h2>{complaintsCount}</h2>
            </div>

            <div className="statCard" onClick={() => setActiveCard("payments")}>
              <h4>💰 Pending Payments</h4>
              <h2>{pendingPayments}</h2>
            </div>

          </div>

          {activeCard && (
            <div className="card">
              <h3>📊 Details</h3>

              <input
                className="searchInput"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* USERS */}
              {activeCard === "users" && (
                <table className="proTable">
                  <tbody>
                    {filterData(users, ["name", "email"]).map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* INVENTORY */}
              {activeCard === "inventory" && (
                <table className="proTable">
                  <tbody>
                    {filterData(inventory, ["name", "itemName"]).map(i => (
                      <tr key={i.id}>
                        <td>{i.name || i.itemName}</td>
                        <td>{i.quantity || i.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* COMPLAINTS */}
              {activeCard === "complaints" && (
                <table className="proTable">
                  <thead>
                    <tr>
                      <th>Complaint</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterData(complaints, ["title", "description", "message"]).map(c => (
                      <tr key={c.id}>
                        <td>{c.title || c.description || c.message}</td>
                        <td>{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* PAYMENTS */}
              {activeCard === "payments" && (
                <table className="proTable">
                  <tbody>
                    {payments
                      .filter(p => p.status === "Pending")
                      .map(p => (
                        <tr key={p.id}>
                          <td>{p.userName}</td>
                          <td>₹{p.amount}</td>
                          <td>{p.status}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* ================= USER DASHBOARD ================= */}
      {u?.role === "User" && (
        <>
          <div className="statsGrid">

            <div className="statCard" onClick={() => setActiveCard("menu")}>
              <h4>🍽 Today Menu</h4>
            </div>

            <div className="statCard" onClick={() => setActiveCard("attendance")}>
              <h4>📅 Attendance</h4>
            </div>

            <div className="statCard" onClick={() => setActiveCard("timing")}>
              <h4>⏰ Mess Time</h4>
            </div>

            <div className="statCard" onClick={() => setActiveCard("payments")}>
              <h4>💰 My Payments</h4>
            </div>

          </div>

          {activeCard && (
            <div className="card fadeIn">
              <h3>📊 Details</h3>

              {activeCard === "menu" && (
                <>
                  <p>🍳 Breakfast: {todayMenu?.breakfast?.items || "N/A"}</p>
                  <p>🍛 Lunch: {todayMenu?.lunch?.items || "N/A"}</p>
                  <p>🍽 Dinner: {todayMenu?.dinner?.items || "N/A"}</p>
                </>
              )}

              {activeCard === "attendance" && (
                <p>Status: {attendance?.status || "Not marked"}</p>
              )}

              {activeCard === "timing" && (
                <>
                  <p>Breakfast: 7–9 AM</p>
                  <p>Lunch: 12–2 PM</p>
                  <p>Dinner: 7–9 PM</p>
                </>
              )}

              {activeCard === "payments" && (
                <>
                  {payments.length > 0 ? (
                    payments.map(p => (
                      <p key={p.id}>
                        ₹{p.amount} - {p.status}
                      </p>
                    ))
                  ) : (
                    <p>No payments</p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}