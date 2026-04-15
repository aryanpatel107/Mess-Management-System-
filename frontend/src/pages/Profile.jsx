import { useEffect, useState } from "react";
import api from "../api";

export default function Profile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    room_no: "",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setError("");
      const res = await api.get("/users/me");

      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        contact: res.data.contact || "",
        room_no: res.data.room_no || "",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load profile");
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function save() {
    try {
      setSaving(true);
      setMsg("");
      setError("");

      const payload = {
        name: form.name.trim(),
        contact: form.contact.trim(),
        room_no: form.room_no.trim(),
      };

      const res = await api.put("/users/me", payload);
      const updatedUser = res.data.user;

      localStorage.setItem("user_name", updatedUser.name || "");
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setForm((prev) => ({
        ...prev,
        name: updatedUser.name || "",
        contact: updatedUser.contact || "",
        room_no: updatedUser.room_no || "",
      }));

      setMsg("Profile updated successfully ✅");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profilePageWrap">
      <div className="profileCompactCard">
        <div className="profileCompactHeader">
          <div>
            <h2 className="profileCompactTitle">My Profile</h2>
            <p className="profileCompactSubtitle">
              Manage your personal details in a clean and compact view.
            </p>
          </div>

          <div className="profileAvatarMini">
            {(form.name || "U").charAt(0).toUpperCase()}
          </div>
        </div>

        {msg && <div className="profileAlert profileAlertSuccess">{msg}</div>}
        {error && <div className="profileAlert profileAlertError">{error}</div>}

        <div className="profileCompactGrid">
          <div className="profileField">
            <label className="profileLabel">Name</label>
            <input
              type="text"
              name="name"
              className="profileInputCompact"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />
          </div>

          <div className="profileField">
            <label className="profileLabel">Email</label>
            <input
              type="email"
              name="email"
              className="profileInputCompact profileInputDisabled"
              value={form.email}
              disabled
            />
          </div>

          <div className="profileField">
            <label className="profileLabel">Contact</label>
            <input
              type="text"
              name="contact"
              className="profileInputCompact"
              value={form.contact}
              onChange={handleChange}
              placeholder="Enter contact number"
            />
          </div>

          <div className="profileField">
            <label className="profileLabel">Room No</label>
            <input
              type="text"
              name="room_no"
              className="profileInputCompact"
              value={form.room_no}
              onChange={handleChange}
              placeholder="Enter room number"
            />
          </div>
        </div>

        <div className="profileCompactActions">
          <button
            className="btn btnBlue profileSaveBtnCompact"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}