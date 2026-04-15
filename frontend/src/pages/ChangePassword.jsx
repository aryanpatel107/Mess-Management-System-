import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { updateStoredUser, logout } from "../auth";

export default function ChangePassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/change-password", form);

      if (!res?.data?.user || !res?.data?.access_token) {
        throw new Error("Invalid response from server");
      }

      updateStoredUser(res.data.user, res.data.access_token);
      setMsg("Password changed successfully");

      setTimeout(() => {
        navigate("/app");
      }, 500);
    } catch (e) {
      console.error("CHANGE PASSWORD ERROR:", e);
      setErr(e?.response?.data?.error || e?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h1>Change Password</h1>

        <p className="muted" style={{ marginBottom: 16 }}>
          You must change your temporary password before using the system.
        </p>

        {msg && <div className="badge">{msg}</div>}
        {err && <div className="errorBox">{err}</div>}

        <form onSubmit={handleSubmit}>
          <label>Temporary / Current Password</label>
          <input
            className="input"
            type="password"
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            placeholder="Enter current password"
            required
          />

          <label>New Password</label>
          <input
            className="input"
            type="password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            placeholder="Enter new password"
            required
          />

          <label>Confirm New Password</label>
          <input
            className="input"
            type="password"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            placeholder="Confirm new password"
            required
          />

          <button className="btn btnBlue" type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Change Password"}
          </button>
        </form>

        <button
          className="btn"
          type="button"
          style={{ marginTop: 12 }}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}