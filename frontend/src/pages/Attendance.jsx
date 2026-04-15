import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDayName(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB");
}

export default function Attendance() {
  const user = getUser();
  const navigate = useNavigate();
  const isAdminOrStaff = user?.role === "Admin" || user?.role === "Staff";

  const [date, setDate] = useState(todayYYYYMMDD());
  const [mealType, setMealType] = useState("Lunch");
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [billingInfo, setBillingInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isAdminOrStaff) return;

    api
      .get("/users")
      .then((res) => {
        const list = (res.data || []).filter((u) => u.role === "User");
        setUsers(list);
        if (list.length > 0) {
          setSelectedUserId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, [isAdminOrStaff]);

  async function loadRecords() {
    setErr("");
    try {
      let url = "/attendance";

      if (isAdminOrStaff) {
        url = `/attendance?date=${encodeURIComponent(date)}&meal_type=${encodeURIComponent(mealType)}`;
      }

      const res = await api.get(url);
      setRecords(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load attendance");
    }
  }

  useEffect(() => {
    loadRecords();
  }, [date, mealType, isAdminOrStaff]);

  async function markAttendance(status) {
    setMsg("");
    setErr("");
    setBillingInfo(null);
    setLoading(true);

    try {
      const payload = {
        user_id: Number(selectedUserId),
        date,
        meal_type: mealType,
        status,
      };

      const res = await api.post("/attendance", payload);

      setMsg(
        [res.data?.message, res.data?.billing_message].filter(Boolean).join(" • ") ||
          "Attendance saved"
      );

      setBillingInfo(res.data?.bill || null);
      await loadRecords();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  }

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return records;

    return records.filter((r) => {
      const dayName = getDayName(r.date).toLowerCase();
      const dateValue = String(r.date || "").toLowerCase();
      const meal = String(r.meal_type || "").toLowerCase();
      const status = String(r.status || "").toLowerCase();

      return (
        dateValue.includes(q) ||
        dayName.includes(q) ||
        meal.includes(q) ||
        status.includes(q)
      );
    });
  }, [records, searchTerm]);

  const takenList = useMemo(
    () => filteredRecords.filter((r) => r.status === "Taken"),
    [filteredRecords]
  );

  const skippedList = useMemo(
    () => filteredRecords.filter((r) => r.status === "Skipped"),
    [filteredRecords]
  );

  function getUserName(userId) {
    const found = users.find((u) => u.id === userId);
    return found ? found.name : `User ID: ${userId}`;
  }

  return (
    <div className="attendancePage">
      {isAdminOrStaff ? (
        <>
          <div className="card attendanceAdminCard">
            <div className="attendanceAdminHeader">
              <div>
                <h1>Meal Attendance</h1>
                <p className="muted">Admin/Staff can mark attendance for users.</p>
              </div>
            </div>

            {msg && <div className="status-box status-success">{msg}</div>}
            {err && <div className="status-box status-error">{err}</div>}

            {billingInfo && (
              <div className="attendanceBillCard">
                <h3>Bill Created for This Attendance</h3>
                <p className="muted">
                  {billingInfo.period} • {billingInfo.bill_type} • ₹{billingInfo.amount} •{" "}
                  {billingInfo.status}
                </p>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn btnBlue" onClick={() => navigate("/app/billing")}>
                    View Bills / Pay Bill
                  </button>
                </div>
              </div>
            )}

            <div className="attendanceCompactGrid">
              <div className="attendanceFieldCompact">
                <label className="muted">Date</label>
                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="attendanceFieldCompact">
                <label className="muted">Meal Type</label>
                <select
                  className="input"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                >
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                </select>
              </div>

              <div className="attendanceFieldCompact attendanceStudentField">
                <label className="muted">Select Student</label>
                <select
                  className="input"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendanceActionCompact">
                <button
                  className="btn btnGreen"
                  disabled={loading || !selectedUserId}
                  onClick={() => markAttendance("Taken")}
                >
                  Mark Taken
                </button>

                <button
                  className="btn btnRed"
                  disabled={loading || !selectedUserId}
                  onClick={() => markAttendance("Skipped")}
                >
                  Mark Skipped
                </button>
              </div>
            </div>
          </div>

          <div className="grid attendanceTableGrid">
            <div className="card attendanceMiniCard">
              <div className="attendanceTableTitleRow">
                <h2>Taken List</h2>
                <span className="badge">{takenList.length}</span>
              </div>

              <div className="tableWrap">
                <table className="attendanceTable">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Meal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {takenList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="attendanceEmptyCell">
                          No taken records
                        </td>
                      </tr>
                    ) : (
                      takenList.map((r) => (
                        <tr key={r.id}>
                          <td>{getUserName(r.user_id)}</td>
                          <td>{formatDate(r.date)}</td>
                          <td>{getDayName(r.date)}</td>
                          <td>{r.meal_type}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card attendanceMiniCard">
              <div className="attendanceTableTitleRow">
                <h2>Skipped List</h2>
                <span className="badge">{skippedList.length}</span>
              </div>

              <div className="tableWrap">
                <table className="attendanceTable">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Meal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skippedList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="attendanceEmptyCell">
                          No skipped records
                        </td>
                      </tr>
                    ) : (
                      skippedList.map((r) => (
                        <tr key={r.id}>
                          <td>{getUserName(r.user_id)}</td>
                          <td>{formatDate(r.date)}</td>
                          <td>{getDayName(r.date)}</td>
                          <td>{r.meal_type}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card attendanceUserCard">
          <h1>My Attendance</h1>
          <p className="muted" style={{ marginBottom: 16 }}>
            You can only view your attendance. Only Admin/Staff can mark it.
          </p>

          {err && <div className="status-box status-error">{err}</div>}

          <div className="attendanceSearchBar">
            <div className="attendanceSearchLeft">
              <label className="muted">Search Attendance</label>
              <input
                className="input attendanceSearchInput"
                type="text"
                placeholder="Search by date (2026-03-30), day name (Monday), or meal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button className="btn btnBlue attendanceRefreshBtn" onClick={loadRecords}>
              Refresh
            </button>
          </div>

          <div className="grid attendanceTableGrid">
            <div className="card attendanceMiniCard">
              <div className="attendanceTableTitleRow">
                <h3>Marked as Present / Taken</h3>
                <span className="badge">{takenList.length}</span>
              </div>

              <div className="tableWrap">
                <table className="attendanceTable">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Meal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {takenList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="attendanceEmptyCell">
                          No taken records
                        </td>
                      </tr>
                    ) : (
                      takenList.map((r) => (
                        <tr key={r.id}>
                          <td>{formatDate(r.date)}</td>
                          <td>{getDayName(r.date)}</td>
                          <td>{r.meal_type}</td>
                          <td>
                            <span className="attendanceStatus attendanceStatusTaken">
                              Taken
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card attendanceMiniCard">
              <div className="attendanceTableTitleRow">
                <h3>Marked as Skipped</h3>
                <span className="badge">{skippedList.length}</span>
              </div>

              <div className="tableWrap">
                <table className="attendanceTable">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Meal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skippedList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="attendanceEmptyCell">
                          No skipped records
                        </td>
                      </tr>
                    ) : (
                      skippedList.map((r) => (
                        <tr key={r.id}>
                          <td>{formatDate(r.date)}</td>
                          <td>{getDayName(r.date)}</td>
                          <td>{r.meal_type}</td>
                          <td>
                            <span className="attendanceStatus attendanceStatusSkipped">
                              Skipped
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}