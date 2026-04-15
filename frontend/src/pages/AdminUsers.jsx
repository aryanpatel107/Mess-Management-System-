import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function AdminUsers() {
  const currentUser = getUser();
  const currentRole = currentUser?.role || localStorage.getItem("role") || "User";

  const canAddUsers = currentRole === "Admin" || currentRole === "Staff";
  const canChangeRole = currentRole === "Admin";
  const canDeleteUsers = currentRole === "Admin";

  const roleOptionsForCreate = useMemo(() => {
    if (currentRole === "Admin") return ["User", "Staff", "Admin"];
    if (currentRole === "Staff") return ["User"];
    return [];
  }, [currentRole]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "User",
    room_no: "",
    contact: "",
  });

  const [search, setSearch] = useState("");

  const [addMessage, setAddMessage] = useState("");
  const [addMessageType, setAddMessageType] = useState("");

  const [importMessage, setImportMessage] = useState("");
  const [importMessageType, setImportMessageType] = useState("");

  const [excelFile, setExcelFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("FETCH USERS ERROR:", err);
      setAddMessage(err?.response?.data?.error || "Failed to load users");
      setAddMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setAddMessage("");
    setAddMessageType("");

    try {
      setSaving(true);

      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        room_no: form.room_no,
        contact: form.contact,
      };

      const res = await api.post("/users", payload);

      const mailNote =
        res.data?.email_status === "sent"
          ? " Temporary password email sent successfully."
          : res.data?.email_status === "failed"
          ? " User added, but email sending failed. Check backend mail settings."
          : "";

      setAddMessage((res.data?.message || "User added successfully") + mailNote);
      setAddMessageType(res.data?.email_status === "failed" ? "error" : "success");

      setForm({
        name: "",
        email: "",
        role: "User",
        room_no: "",
        contact: "",
      });

      fetchUsers();
    } catch (err) {
      console.error("ADD USER ERROR:", err);
      setAddMessage(err?.response?.data?.error || "Failed to add user");
      setAddMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleUpdate(userId) {
    const roleValue = document.getElementById(`role-${userId}`)?.value;

    try {
      const res = await api.put(`/users/${userId}/role`, { role: roleValue });
      setAddMessage(res.data?.message || "Role updated successfully");
      setAddMessageType("success");
      fetchUsers();
    } catch (err) {
      console.error("ROLE UPDATE ERROR:", err);
      setAddMessage(err?.response?.data?.error || "Failed to update role");
      setAddMessageType("error");
    }
  }

  async function handleDelete(userId) {
    const ok = window.confirm("Are you sure you want to delete this user?");
    if (!ok) return;

    try {
      const res = await api.delete(`/users/${userId}`);
      setAddMessage(res.data?.message || "User deleted successfully");
      setAddMessageType("success");
      fetchUsers();
    } catch (err) {
      console.error("DELETE USER ERROR:", err);
      setAddMessage(err?.response?.data?.error || "Failed to delete user");
      setAddMessageType("error");
    }
  }

  async function handleImportExcel() {
    setImportMessage("");
    setImportMessageType("");
    setImportResult(null);

    if (!excelFile) {
      setImportMessage("Please choose an Excel file first");
      setImportMessageType("error");
      return;
    }

    try {
      setImporting(true);

      const formData = new FormData();
      formData.append("file", excelFile);

      const res = await api.post("/users/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setImportResult(res.data);
      setImportMessage(res.data?.message || "Excel imported successfully");
      setImportMessageType(
        res.data?.summary?.email_failed_count > 0 ? "error" : "success"
      );

      setExcelFile(null);
      const fileInput = document.getElementById("student-excel-input");
      if (fileInput) fileInput.value = "";

      fetchUsers();
    } catch (err) {
      console.error("IMPORT EXCEL ERROR:", err);
      const backendError =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to import users from Excel";

      setImportMessage(backendError);
      setImportMessageType("error");
    } finally {
      setImporting(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.role || "").toLowerCase().includes(term) ||
      String(u.room_no || "").toLowerCase().includes(term) ||
      String(u.contact || "").toLowerCase().includes(term)
    );
  });

  const normalUsers = filteredUsers.filter((u) => u.role === "User");
  const staffUsers = filteredUsers.filter((u) => u.role === "Staff");
  const adminUsers = filteredUsers.filter((u) => u.role === "Admin");

  function UserTable({ title, list }) {
    return (
      <div className="admin-users-card card" style={{ marginBottom: 20 }}>
        <h3>{title}</h3>

        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Room</th>
                <th>Contact</th>
                <th>Temp Password</th>
                <th>Change Role</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan="8">No users found.</td>
                </tr>
              ) : (
                list.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-chip role-${(u.role || "").toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.room_no || "-"}</td>
                    <td>{u.contact || "-"}</td>
                    <td>{u.must_change_password ? "Pending Change" : "Changed"}</td>
                    <td>
  {canChangeRole ? (
    <div className="role-actions-pro">

      <select
        id={`role-${u.id}`}
        defaultValue={u.role}
        className="role-select-pro"
      >
        <option value="User">👤 User</option>
        <option value="Staff">🛠 Staff</option>
        <option value="Admin">👑 Admin</option>
      </select>

      <button
        className="btn btn-update-pro"
        onClick={() => handleRoleUpdate(u.id)}
      >
        ⚡ Update
      </button>

    </div>
  ) : (
    "-"
  )}
</td>
                    <td>
                      {canDeleteUsers ? (
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(u.id)}
                        >
                          Delete
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid admin-users-page" style={{ alignItems: "start" }}>
      <div className="admin-users-card card">
        <h2>Manage Users</h2>

        {addMessage ? (
          <div className={`status-box ${addMessageType === "success" ? "status-success" : "status-error"}`}>
            {addMessage}
          </div>
        ) : null}

        {canAddUsers && (
          <>
            <form onSubmit={handleAddUser} className="user-form">
              <input
                className="input"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={onChange}
              />

              <input
                className="input"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={onChange}
              />

              <select
                className="input"
                name="role"
                value={form.role}
                onChange={onChange}
              >
                {roleOptionsForCreate.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <input
                className="input"
                name="room_no"
                placeholder="Room No"
                value={form.room_no}
                onChange={onChange}
              />

              <input
                className="input"
                name="contact"
                placeholder="Contact"
                value={form.contact}
                onChange={onChange}
              />

              <button className="btn btn-add" type="submit" disabled={saving}>
                {saving ? "Adding..." : "Add User"}
              </button>
            </form>

            <p className="muted" style={{ marginTop: 12 }}>
              Temporary password will be generated automatically and sent to the user's email.
            </p>

            <hr style={{ margin: "22px 0", border: "none", borderTop: "1px solid rgba(0,0,0,0.08)" }} />

            <h3>Import Students from Excel</h3>

            {importMessage ? (
              <div className={`status-box ${importMessageType === "success" ? "status-success" : "status-error"}`}>
                {importMessage}
              </div>
            ) : null}

            <p className="muted">
              Excel must contain columns like: Name, Email, Mobile/Contact, Room No
            </p>

            <div className="excel-upload-box">
              <input
                id="student-excel-input"
                type="file"
                accept=".xlsx"
                className="input"
                onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
              />

              <button
                type="button"
                className="btn btn-import"
                onClick={handleImportExcel}
                disabled={importing}
              >
                {importing ? "Importing..." : "Import Excel"}
              </button>
            </div>

            {importResult && (
              <div style={{ marginTop: 18 }}>
                <div className="import-summary-card">
                  <h4>Import Summary</h4>
                  <div className="import-summary-grid">
                    <div><strong>Total Rows:</strong> {importResult.summary?.total_rows || 0}</div>
                    <div><strong>Added:</strong> {importResult.summary?.added_count || 0}</div>
                    <div><strong>Skipped:</strong> {importResult.summary?.skipped_count || 0}</div>
                    <div><strong>Failed Rows:</strong> {importResult.summary?.failed_count || 0}</div>
                    <div><strong>Email Sent:</strong> {importResult.summary?.email_sent_count || 0}</div>
                    <div><strong>Email Failed:</strong> {importResult.summary?.email_failed_count || 0}</div>
                  </div>
                </div>

                {importResult.added_users?.length > 0 && (
                  <div className="admin-users-card card" style={{ marginTop: 14 }}>
                    <h4>Added Users</h4>
                    <div style={{ overflowX: "auto" }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Room</th>
                            <th>Contact</th>
                            <th>Temp Password</th>
                            <th>Email Status</th>
                            <th>Email Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.added_users.map((u) => (
                            <tr key={`${u.email}-${u.row_number}`}>
                              <td>{u.row_number}</td>
                              <td>{u.name}</td>
                              <td>{u.email}</td>
                              <td>{u.room_no || "-"}</td>
                              <td>{u.contact || "-"}</td>
                              <td>{u.temp_password}</td>
                              <td>{u.email_status}</td>
                              <td>{u.email_error || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importResult.skipped_users?.length > 0 && (
                  <div className="admin-users-card card" style={{ marginTop: 14 }}>
                    <h4>Skipped Users</h4>
                    <div style={{ overflowX: "auto" }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Email</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.skipped_users.map((u, i) => (
                            <tr key={`${u.email || "skip"}-${i}`}>
                              <td>{u.row_number}</td>
                              <td>{u.email || "-"}</td>
                              <td>{u.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importResult.failed_users?.length > 0 && (
                  <div className="admin-users-card card" style={{ marginTop: 14 }}>
                    <h4>Failed Rows</h4>
                    <div style={{ overflowX: "auto" }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Email</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.failed_users.map((u, i) => (
                            <tr key={`${u.email || "fail"}-${i}`}>
                              <td>{u.row_number}</td>
                              <td>{u.email || "-"}</td>
                              <td>{u.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <div className="admin-users-card card" style={{ marginBottom: 20 }}>
          <h3>Search Users</h3>
          <p className="muted">Search by name, email, role, room, or contact</p>
          <input
            className="input"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="admin-users-card card">
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <UserTable title="Users List" list={normalUsers} />
            <UserTable title="Staff List" list={staffUsers} />
            <UserTable title="Admin List" list={adminUsers} />
          </>
        )}
      </div>
    </div>
  );
}