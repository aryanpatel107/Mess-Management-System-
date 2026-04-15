import { useEffect, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function Notifications() {
  const user = getUser();
  const canAdd = user?.role === "Admin" || user?.role === "Staff";

  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    title: "",
    message: "",
    role_target: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    try {
      const res = await api.get("/notifications");
      setList(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load notifications");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addNotification() {
    setMsg("");
    setErr("");

    if (!form.title || !form.message) {
      setErr("Title and Message are required");
      return;
    }

    try {
      const payload = {
        title: form.title,
        message: form.message,
        role_target: form.role_target || null,
      };

      const res = await api.post("/notifications", payload);
      setMsg(res.data?.message || "Notification created");

      setForm({
        title: "",
        message: "",
        role_target: "",
      });

      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to create notification");
    }
  }

  return (
    <div className="grid">
      {canAdd && (
        <div className="card">
          <h1>Notifications</h1>

          {msg && <div className="badge" style={{ marginBottom: 12 }}>{msg}</div>}
          {err && (
            <div className="card" style={{ borderColor: "rgba(239,68,68,.35)", marginBottom: 12 }}>
              {err}
            </div>
          )}

          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            className="input"
            rows="5"
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />

          <select
            className="input"
            value={form.role_target}
            onChange={(e) => setForm({ ...form, role_target: e.target.value })}
          >
            <option value="">All</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="User">User</option>
          </select>

          <button className="btn btnBlue" onClick={addNotification}>
            Send Notification
          </button>
        </div>
      )}

      <div className="card">
        <h2>Recent</h2>

        {list.length === 0 ? (
          <p className="muted">No notifications found</p>
        ) : (
          <ul className="muted">
            {list.map((n) => (
              <li key={n.id} style={{ marginBottom: 14 }}>
                <b>{n.title}</b> ({n.role_target || "All"})
                <br />
                {n.message}
              </li>
            ))}
          </ul>
        )}

        <button className="btn btnRed" onClick={load}>
          Refresh
        </button>
      </div>
    </div>
  );
}