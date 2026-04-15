import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    otp: "",
    password: "",
    contact: "",
    room_no: "",
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  async function handleSendOtp() {
    setErr("");
    setMsg("");

    if (!form.email.trim()) {
      setErr("Please enter email first");
      return;
    }

    try {
      setSendingOtp(true);

      const res = await api.post("/auth/send-otp", {
        email: form.email.trim().toLowerCase(),
      });

      setMsg(res.data?.message || "OTP sent successfully");
    } catch (e) {
      console.error("SEND OTP ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        otp: form.otp.trim(),
        password: form.password,
        contact: form.contact.trim(),
        room_no: form.room_no.trim(),
      };

      const res = await api.post("/auth/register", payload);

      setMsg(res.data?.message || "Registered successfully");

      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (e) {
      console.error("REGISTER ERROR:", e);
      setErr(e?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authShell">
      <div className="authOverlay" />
      <div className="authCard modernAuthCard registerCardWide">
        <div className="authHeader">
          <div className="authBadge">MESS MANAGEMENT</div>
          <h1>Create Account</h1>
          <p>Register with OTP verification</p>
        </div>

        {msg && <div className="successBox">{msg}</div>}
        {err && <div className="errorBox">{err}</div>}

        <form onSubmit={handleSubmit} className="authForm">
          <div className="fieldBlock">
            <label>Full Name</label>
            <input
              className="input authInput"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="fieldBlock">
            <label>Email</label>
            <div className="inlineField">
              <input
                className="input authInput"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email"
                required
              />
              <button
                type="button"
                className="btn authSecondaryBtn otpBtn"
                onClick={handleSendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </div>

          <div className="fieldBlock">
            <label>OTP</label>
            <input
              className="input authInput"
              type="text"
              maxLength={6}
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              placeholder="Enter 6-digit OTP"
              required
            />
          </div>

          <div className="fieldBlock">
            <label>Password</label>
            <input
              className="input authInput"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create password"
              required
            />
          </div>

          <div className="twoColGrid">
            <div className="fieldBlock">
              <label>Contact Number</label>
              <input
                className="input authInput"
                type="text"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Enter contact number"
              />
            </div>

            <div className="fieldBlock">
              <label>Room No</label>
              <input
                className="input authInput"
                type="text"
                value={form.room_no}
                onChange={(e) => setForm({ ...form, room_no: e.target.value })}
                placeholder="Enter room number"
              />
            </div>
          </div>

          <button className="btn authPrimaryBtn" type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Register"}
          </button>
        </form>

        <div className="authFooterText">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}