import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { saveAuth } from "../auth";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁 toggle

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password
      };

      const res = await api.post("/auth/login", payload);

      if (!res?.data?.access_token || !res?.data?.user) {
        throw new Error("Invalid login response from server");
      }

      saveAuth(res.data);
      setMsg("Login successful");

      setTimeout(() => {
        if (res.data.user.must_change_password) {
          navigate("/change-password");
        } else {
          navigate("/app");
        }
      }, 600);
    } catch (e) {
      if (e.code === "ECONNABORTED") {
        setErr("Server timeout.");
      } else if (e.message === "Network Error") {
        setErr("Backend not running.");
      } else {
        setErr(e?.response?.data?.error || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authShell">
      <div className="authOverlay" />

      <div className="authCard modernAuthCard">
        <div className="authHeader">
          <div className="authBadge">MESS MANAGEMENT</div>
          <h1>Welcome Back</h1>
          <p>Login to continue to your account</p>
        </div>

        {msg && <div className="successBox">{msg}</div>}
        {err && <div className="errorBox">{err}</div>}

        <form onSubmit={handleSubmit} className="authForm">

          {/* EMAIL */}
          <div className="fieldBlock">
            <label>Email</label>
            <input
              className="input authInput"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="Enter your email"
              required
            />
          </div>

          {/* PASSWORD WITH 👁 */}
          <div className="fieldBlock">
            <label>Password</label>

            <div className="passwordWrapper">
              <input
                className="input authInput"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Enter your password"
                required
              />

              <span
                className="eyeEmoji"
                onClick={() => setShowPassword(!showPassword)}
              >
                👁
              </span>
            </div>
          </div>

          {/* BUTTON */}
          <button
            className="btn authPrimaryBtn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Login"}
          </button>

        </form>

        <div className="authFooterText">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}