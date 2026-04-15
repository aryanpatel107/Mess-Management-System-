import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function HelpCentre() {
  const user = getUser();
  const role = user?.role || "User";
  const isStaffOrAdmin = role === "Admin" || role === "Staff";

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");

  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function loadTickets() {
    try {
      setLoading(true);
      const res = await api.get("/help-centre/tickets");
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load help tickets");
    } finally {
      setLoading(false);
    }
  }

  async function openTicket(ticketId) {
    try {
      const res = await api.get(`/help-centre/tickets/${ticketId}`);
      setSelectedTicket(res.data);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load ticket chat");
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;

    return tickets.filter((t) => {
      const text = [
        t.subject,
        t.category,
        t.status,
        t.user_name,
        t.user_email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [tickets, search]);

  async function createTicket(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!subject.trim() || !message.trim()) {
      setErr("Subject and message are required");
      return;
    }

    try {
      const res = await api.post("/help-centre/tickets", {
        subject,
        category,
        message,
      });

      setMsg(res.data?.message || "Help ticket created successfully");
      setSubject("");
      setCategory("General");
      setMessage("");

      await loadTickets();
      if (res.data?.ticket?.id) {
        await openTicket(res.data.ticket.id);
      }
    } catch (e2) {
      setErr(e2?.response?.data?.error || "Failed to create help ticket");
    }
  }

  async function sendReply() {
    setMsg("");
    setErr("");

    if (!selectedTicket?.id) {
      setErr("Select a ticket first");
      return;
    }

    if (!reply.trim()) {
      setErr("Reply is required");
      return;
    }

    try {
      const res = await api.post(`/help-centre/tickets/${selectedTicket.id}/messages`, {
        message: reply,
      });

      setMsg(res.data?.message || "Reply sent successfully");
      setReply("");
      await loadTickets();
      await openTicket(selectedTicket.id);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to send reply");
    }
  }

  async function updateStatus(status) {
    setMsg("");
    setErr("");

    if (!selectedTicket?.id) return;

    try {
      const res = await api.put(`/help-centre/tickets/${selectedTicket.id}/status`, {
        status,
      });

      setMsg(res.data?.message || "Ticket status updated");
      await loadTickets();
      await openTicket(selectedTicket.id);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to update ticket status");
    }
  }

  return (
    <div className="help-centre-page">
      <div className="help-centre-header">
        <div>
          <h1>Help Centre</h1>
          <p>Raise issue tickets and chat with Admin/Staff support.</p>
        </div>
      </div>

      {msg && <div className="help-alert success">{msg}</div>}
      {err && <div className="help-alert error">{err}</div>}

      <div className="help-centre-grid">
        <div className="help-card">
          <h2>Create New Ticket</h2>

          <form onSubmit={createTicket} className="help-form">
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="help-input"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="help-input"
            >
              <option value="General">General</option>
              <option value="Billing">Billing</option>
              <option value="Attendance">Attendance</option>
              <option value="Menu">Menu</option>
              <option value="Complaint">Complaint</option>
              <option value="Technical">Technical</option>
            </select>

            <textarea
              placeholder="Describe your issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="help-textarea"
              rows={5}
            />

            <button type="submit" className="help-btn primary">
              Create Ticket
            </button>
          </form>
        </div>

        <div className="help-card">
          <div className="help-ticket-top">
            <h2>{isStaffOrAdmin ? "All Tickets" : "My Tickets"}</h2>
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="help-input"
            />
          </div>

          {loading ? (
            <p className="help-muted">Loading...</p>
          ) : filteredTickets.length === 0 ? (
            <p className="help-muted">No tickets found</p>
          ) : (
            <div className="help-ticket-list">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`help-ticket-item ${
                    selectedTicket?.id === ticket.id ? "active" : ""
                  }`}
                  onClick={() => openTicket(ticket.id)}
                >
                  <div className="help-ticket-row">
                    <strong>{ticket.subject}</strong>
                    <span className={`help-badge ${ticket.status.toLowerCase()}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div className="help-ticket-meta">
                    <span>{ticket.category || "General"}</span>
                    <span>#{ticket.id}</span>
                  </div>

                  {isStaffOrAdmin && (
                    <div className="help-ticket-user">
                      {ticket.user_name} • {ticket.user_email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="help-card help-chat-card">
        {!selectedTicket ? (
          <p className="help-muted">Select a ticket to open chat</p>
        ) : (
          <>
            <div className="help-chat-header">
              <div>
                <h2>{selectedTicket.subject}</h2>
                <p>
                  {selectedTicket.category || "General"} • {selectedTicket.status}
                  {isStaffOrAdmin && (
                    <> • {selectedTicket.user_name} ({selectedTicket.user_email})</>
                  )}
                </p>
              </div>

              {isStaffOrAdmin && (
                <div className="help-chat-actions">
                  <button
                    className="help-btn secondary"
                    onClick={() => updateStatus("Open")}
                  >
                    Open
                  </button>
                  <button
                    className="help-btn danger"
                    onClick={() => updateStatus("Closed")}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            <div className="help-messages">
              {selectedTicket.messages?.length ? (
                selectedTicket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`help-message ${
                      m.sender_role === "Admin" || m.sender_role === "Staff"
                        ? "staff"
                        : "user"
                    }`}
                  >
                    <div className="help-message-top">
                      <strong>{m.sender_name}</strong>
                      <span>{m.sender_role}</span>
                    </div>
                    <div className="help-message-body">{m.message}</div>
                    <div className="help-message-time">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="help-muted">No messages</p>
              )}
            </div>

            {selectedTicket.status !== "Closed" && isStaffOrAdmin && (
              <div className="help-reply-box">
                <textarea
                  placeholder="Write reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="help-textarea"
                  rows={4}
                />
                <button className="help-btn primary" onClick={sendReply}>
                  Send Reply
                </button>
              </div>
            )}

            {selectedTicket.status !== "Closed" && !isStaffOrAdmin && (
              <div className="help-note-box">
                Only Admin/Staff can reply. You can wait for support response.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}