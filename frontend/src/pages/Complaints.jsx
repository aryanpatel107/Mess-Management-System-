import { useEffect, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function Complaints() {
  const u = getUser();
  const isAdmin = u?.role === "Admin" || u?.role === "Staff";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    type: "Food quality",
    message: ""
  });

  useEffect(() => {
    load();
  }, []);

  // 🔥 LOAD
  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/complaints");
      setList(res.data || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
      alert("❌ Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }

  // 🔥 SUBMIT
  async function submit() {
    try {
      if (!form.message.trim()) {
        alert("⚠️ Please enter complaint");
        return;
      }

      setLoading(true);

      await api.post("/complaints", form);

      alert("✅ Complaint submitted");

      setForm({ type: "Food quality", message: "" });

      load();
      window.dispatchEvent(new Event("refreshDashboard"));
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      alert(err?.response?.data?.message || "❌ Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  // 🔥 RESOLVE
  async function resolve(id) {
    try {
      if (!window.confirm("Mark as resolved?")) return;

      setLoading(true);

      await api.put(`/complaints/${id}/status`, {
        status: "Resolved"
      });

      alert("✅ Resolved");

      load();
      window.dispatchEvent(new Event("refreshDashboard"));
    } catch (err) {
      console.error("RESOLVE ERROR:", err);
      alert("❌ Failed to resolve");
    } finally {
      setLoading(false);
    }
  }

  // 🔥 DELETE
  async function remove(id) {
    try {
      if (!window.confirm("Delete this complaint?")) return;

      setLoading(true);

      await api.delete(`/complaints/${id}`);

      alert("🗑 Deleted");

      load();
      window.dispatchEvent(new Event("refreshDashboard"));
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert(err?.response?.data?.message || "❌ Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid">

      {/* 👤 USER FORM */}
      {!isAdmin && (
        <div className="card complaintsCard">
          <h2>Submit Complaint</h2>

          <select
            className="input"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
            }
          >
            <option>Food quality</option>
            <option>Hygiene</option>
            <option>Staff behavior</option>
            <option>Quantity issues</option>
          </select>

          <textarea
            className="input"
            rows="4"
            value={form.message}
            onChange={(e) =>
              setForm({ ...form, message: e.target.value })
            }
            placeholder="Write your complaint..."
          />

          <button
            className="btn btnBlue"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}

      {/* 📊 TABLE */}
      <div className="card complaintsCard">
        <h2>Complaints</h2>

        {loading && <p>Loading...</p>}

        <table className="proTable">
          <thead>
            <tr>
              <th>Type</th>
              <th>Message</th>
              <th>Status</th>
              {isAdmin && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {list.length > 0 ? (
              list.map((c) => (
                <tr key={c.id}>
                  <td>{c.type || "N/A"}</td>
                  <td>{c.message || "No message"}</td>

                  <td>
                    <span className={`status ${c.status}`}>
                      {c.status}
                    </span>
                  </td>

                  {isAdmin && (
                    <td>
                      <div className="actionBtns">

                        {c.status !== "Resolved" && (
                          <button
                            className="btn btnGreen"
                            onClick={() => resolve(c.id)}
                            disabled={loading}
                          >
                            {loading ? "..." : "Resolve"}
                          </button>
                        )}

                        <button
                          className="btn btnRed"
                          onClick={() => remove(c.id)}
                          disabled={loading}
                        >
                          {loading ? "..." : "Delete"}
                        </button>

                      </div>
                    </td>
                  )}

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 4 : 3}>
                  No complaints found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}