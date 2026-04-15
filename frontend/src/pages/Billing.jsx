import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

const UPI_ID = "aryanpatel769894-1@okaxis";
const UPI_NAME = "Aryan Patel";

function formatMoney(value) {
  const num = Number(value || 0);
  return `₹${num.toFixed(2)}`;
}

function formatPeriod(period, billType) {
  if (!period) return "-";

  if (billType === "monthly") {
    const [y, m] = String(period).split("-");
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    if (y && m) {
      return `${monthNames[Number(m) - 1] || m}, ${y}`;
    }
  }

  return period;
}

function buildUpiLink(bill) {
  const amount = Number(bill?.amount || 0).toFixed(2);
  const title = bill?.bill_type === "monthly" ? "Monthly Bill" : "Meal Bill";
  const note = `${title} - ${bill?.period || ""}${bill?.meal_type ? ` - ${bill.meal_type}` : ""}`;

  return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(note)}`;
}

function buildQrUrl(bill) {
  const upiLink = buildUpiLink(bill);
  return `https://quickchart.io/qr?size=260&text=${encodeURIComponent(upiLink)}`;
}

function getSearchableText(bill) {
  return [
    bill?.period,
    bill?.bill_type,
    bill?.meal_type,
    bill?.status,
    bill?.user_name,
    bill?.user_email,
    bill?.amount,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function Billing() {
  const user = getUser();
  const role = user?.role || "";
  const isAdminOrStaff = role === "Admin" || role === "Staff";

  const [bills, setBills] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [monthPeriod, setMonthPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [note, setNote] = useState("");
  const [proof, setProof] = useState(null);
  const [paying, setPaying] = useState(false);

  async function loadBills() {
    try {
      setErr("");
      const res = await api.get(isAdminOrStaff ? "/billing/all" : "/billing/my");
      setBills(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load bills");
    }
  }

  async function loadUsers() {
    if (!isAdminOrStaff) return;

    try {
      const res = await api.get("/users");
      const onlyUsers = (res.data || []).filter((u) => u.role === "User");
      setUsers(onlyUsers);

      if (onlyUsers.length > 0) {
        setSelectedUserId(String(onlyUsers[0].id));
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadBills();
    loadUsers();
  }, [isAdminOrStaff]);

  async function generateMonthlyBill() {
    try {
      setLoading(true);
      setMsg("");
      setErr("");

      const payload = { period: monthPeriod };

      if (isAdminOrStaff && selectedUserId) {
        payload.user_id = Number(selectedUserId);
      }

      const res = await api.post("/billing/generate-monthly", payload);
      setMsg(res.data?.message || "Monthly attendance bill generated successfully");
      await loadBills();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to generate monthly bill");
    } finally {
      setLoading(false);
    }
  }

  function openPayModal(bill) {
    setSelectedBill(bill);
    setNote("");
    setProof(null);
    setShowQrModal(true);
  }

  function closePayModal() {
    setShowQrModal(false);
    setSelectedBill(null);
    setNote("");
    setProof(null);
  }

  async function submitPayment() {
    if (!selectedBill) return;

    try {
      setPaying(true);
      setMsg("");
      setErr("");

      const formData = new FormData();
      formData.append("bill_id", selectedBill.id);
      formData.append("mode", "UPI");
      formData.append("note", note);

      if (proof) {
        formData.append("proof", proof);
      }

      const res = await api.post("/billing/pay", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg(res.data?.message || "Payment recorded successfully");
      closePayModal();
      await loadBills();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to update payment");
    } finally {
      setPaying(false);
    }
  }

  const filteredBills = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return bills;
    return bills.filter((bill) => getSearchableText(bill).includes(q));
  }, [bills, searchTerm]);

  const unpaidBills = useMemo(
    () => filteredBills.filter((b) => b.status === "Unpaid" && b.can_pay),
    [filteredBills]
  );

  const paidBills = useMemo(
    () => filteredBills.filter((b) => b.status === "Paid"),
    [filteredBills]
  );

  return (
    <div className="billingPage">
      <div className="billingMain">
        <div className="card billingMainCard">
          <div className="billingHeader">
            <div>
              <h1>{isAdminOrStaff ? "All Bills" : "My Bills"}</h1>
              <p className="muted">
                {isAdminOrStaff
                  ? "View all users bills, search records, generate monthly bills, and complete UPI payments."
                  : "View your bills, search records, generate monthly bills, and complete UPI payments."}
              </p>
            </div>
          </div>

          {msg && <div className="status-box status-success">{msg}</div>}
          {err && <div className="status-box status-error">{err}</div>}

          <div className="card billingGenerateCard">
            <div className="billingGenerateHeader">
              <div>
                <h2>Generate Monthly Bill From Attendance</h2>
                <p className="muted">
                  Mark daily attendance as Taken. You can pay each meal bill separately
                  or generate one monthly bill from all unpaid meal attendance for a month.
                </p>
              </div>
            </div>

            <div className="billingGenerateGrid">
              {isAdminOrStaff && (
                <div>
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
              )}

              <div>
                <label className="muted">Month</label>
                <input
                  className="input"
                  type="month"
                  value={monthPeriod}
                  onChange={(e) => setMonthPeriod(e.target.value)}
                />
              </div>
            </div>

            <div className="billingGenerateAction">
              <button className="btn btnBlue" disabled={loading} onClick={generateMonthlyBill}>
                Generate Monthly Attendance Bill
              </button>
            </div>
          </div>

          <div className="billingSearchWrap">
            <div className="billingSearchLeft">
              <label className="muted">Search Bills</label>
              <input
                className="input billingSearchInput"
                type="text"
                placeholder={
                  isAdminOrStaff
                    ? "Search by date, month, bill type, meal type, amount, status, student name, or email"
                    : "Search by date, month, bill type, meal type, amount, or status"
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button className="btn btnBlue billingRefreshBtn" onClick={loadBills}>
              Refresh
            </button>
          </div>

          <div className="billingSection">
            <div className="billingSectionHeader">
              <h2>Unpaid Bills</h2>
              <span className="badge">{unpaidBills.length}</span>
            </div>

            <div className="tableWrap">
              <table className="billingTable">
                <thead>
                  <tr>
                    {isAdminOrStaff && <th>Student</th>}
                    {isAdminOrStaff && <th>Email</th>}
                    <th>Period</th>
                    <th>Bill Type</th>
                    <th>Meal</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidBills.length === 0 ? (
                    <tr>
                      <td colSpan={isAdminOrStaff ? 8 : 6} className="billingEmptyCell">
                        No unpaid bills found
                      </td>
                    </tr>
                  ) : (
                    unpaidBills.map((bill) => (
                      <tr key={bill.id}>
                        {isAdminOrStaff && <td>{bill.user_name || "-"}</td>}
                        {isAdminOrStaff && <td>{bill.user_email || "-"}</td>}
                        <td>{formatPeriod(bill.period, bill.bill_type)}</td>
                        <td>{bill.bill_type === "monthly" ? "Monthly" : "Daily"}</td>
                        <td>{bill.meal_type || "-"}</td>
                        <td>{formatMoney(bill.amount)}</td>
                        <td>
                          <span className="billingTableBadge billingStatusUnpaid">
                            {bill.status}
                          </span>
                        </td>
                        <td>
                          {bill.can_pay ? (
                            <button className="btn btnBlue billingSmallBtn" onClick={() => openPayModal(bill)}>
                              Pay (UPI)
                            </button>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="billingSection">
            <div className="billingSectionHeader">
              <h2>Paid Bills</h2>
              <span className="badge">{paidBills.length}</span>
            </div>

            <div className="tableWrap">
              <table className="billingTable">
                <thead>
                  <tr>
                    {isAdminOrStaff && <th>Student</th>}
                    {isAdminOrStaff && <th>Email</th>}
                    <th>Period</th>
                    <th>Bill Type</th>
                    <th>Meal</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {paidBills.length === 0 ? (
                    <tr>
                      <td colSpan={isAdminOrStaff ? 8 : 6} className="billingEmptyCell">
                        No paid bills found
                      </td>
                    </tr>
                  ) : (
                    paidBills.map((bill) => (
                      <tr key={bill.id}>
                        {isAdminOrStaff && <td>{bill.user_name || "-"}</td>}
                        {isAdminOrStaff && <td>{bill.user_email || "-"}</td>}
                        <td>{formatPeriod(bill.period, bill.bill_type)}</td>
                        <td>{bill.bill_type === "monthly" ? "Monthly" : "Daily"}</td>
                        <td>{bill.meal_type || "-"}</td>
                        <td>{formatMoney(bill.amount)}</td>
                        <td>
                          <span className="billingTableBadge billingStatusPaid">
                            {bill.status}
                          </span>
                        </td>
                        <td>
                          {bill.payment?.proof_url ? (
                            <a
                              href={bill.payment.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="billingProofLink"
                            >
                              View Proof
                            </a>
                          ) : (
                            <span className="muted">No Proof</span>
                          )}
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

      {showQrModal && selectedBill && (
        <div className="qrModalOverlay" onClick={closePayModal}>
          <div className="qrModalCard billingQrModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="billingQrLayout">
              <div className="billingQrLeft">
                <h2 className="qrTitle">UPI Payment</h2>
                <p className="qrAmountText">Amount to pay: {formatMoney(selectedBill.amount)}</p>

                <div className="qrPreviewCard">
                  <img
                    className="qrImage qrImageSmall"
                    src={buildQrUrl(selectedBill)}
                    alt="UPI QR"
                  />

                  <div className="qrInfoText">
                    <p><strong>{UPI_NAME}</strong></p>
                    <p>UPI ID: {UPI_ID}</p>
                    <p className="muted">
                      Scan this QR and the exact amount will be filled automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="billingQrRight">
                <div className="qrFormSection">
                  <label className="muted">Add note (optional)</label>
                  <textarea
                    className="input"
                    placeholder="Add note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="qrFormSection">
                  <label className="muted">Upload payment proof</label>
                  <input
                    className="input billingFileInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProof(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="row qrButtonRow billingQrButtonRow">
                  <button className="btn btnBlue" disabled={paying} onClick={submitPayment}>
                    I Have Paid
                  </button>
                  <button className="btn btnRed" onClick={closePayModal}>
                    Close
                  </button>
                </div>

                <div className="upiLinkBox">
                  <label className="muted">UPI Link</label>
                  <textarea
                    className="input"
                    readOnly
                    value={buildUpiLink(selectedBill)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}