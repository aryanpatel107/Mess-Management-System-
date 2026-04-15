import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEALS = ["Breakfast", "Lunch", "Dinner"];

function emptyWeeklyItems() {
  return DAYS.reduce((acc, day) => {
    acc[day] = {
      Breakfast: { items: "", price: "" },
      Lunch: { items: "", price: "" },
      Dinner: { items: "", price: "" },
    };
    return acc;
  }, {});
}

export default function Menu() {
  const user = getUser();
  const canManage = user?.role === "Admin" || user?.role === "Staff";

  const [dailyForm, setDailyForm] = useState({
    date: "",
    meal_type: "Lunch",
    items: "",
  });

  const [editingDailyId, setEditingDailyId] = useState(null);

  const [recentMenu, setRecentMenu] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [weeklyItems, setWeeklyItems] = useState(emptyWeeklyItems());
  const [weeklyMenus, setWeeklyMenus] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [editingWeeklyId, setEditingWeeklyId] = useState(null);

  const [weeklySearch, setWeeklySearch] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    loadRecentMenu();
    loadWeeklyMenus();
  }, []);

  async function loadRecentMenu() {
    try {
      setLoadingRecent(true);
      const res = await api.get("/menu");
      setRecentMenu(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Load recent menu failed", e);
    } finally {
      setLoadingRecent(false);
    }
  }

  async function loadWeeklyMenus() {
    try {
      setWeeklyLoading(true);
      const res = await api.get("/menu/weekly");
      setWeeklyMenus(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Load weekly menu failed", e);
    } finally {
      setWeeklyLoading(false);
    }
  }

  async function saveDailyMenu(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!dailyForm.date || !dailyForm.meal_type || !dailyForm.items.trim()) {
      setErr("Please fill date, meal type and food items");
      return;
    }

    try {
      const payload = {
        date: dailyForm.date,
        meal_type: dailyForm.meal_type,
        items: dailyForm.items.trim(),
      };

      const res = editingDailyId
        ? await api.put(`/menu/${editingDailyId}`, payload)
        : await api.post("/menu", payload);

      setMsg(
        res.data?.message ||
          (editingDailyId ? "Menu updated successfully" : "Menu added successfully")
      );

      setDailyForm({
        date: "",
        meal_type: "Lunch",
        items: "",
      });
      setEditingDailyId(null);
      loadRecentMenu();
    } catch (e) {
      console.error("Save daily menu error", e);
      setErr(e?.response?.data?.error || "Failed to save menu");
    }
  }

  function editDailyMenu(menu) {
    setEditingDailyId(menu.id);
    setDailyForm({
      date: menu.date || "",
      meal_type: menu.meal_type || "Lunch",
      items: menu.items || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteDailyMenu(menuId) {
    const ok = window.confirm("Are you sure you want to delete this daily menu?");
    if (!ok) return;

    try {
      const res = await api.delete(`/menu/${menuId}`);
      setMsg(res.data?.message || "Menu deleted successfully");

      if (editingDailyId === menuId) {
        setEditingDailyId(null);
        setDailyForm({
          date: "",
          meal_type: "Lunch",
          items: "",
        });
      }

      loadRecentMenu();
    } catch (e) {
      console.error("Delete daily menu error", e);
      setErr(e?.response?.data?.error || "Failed to delete menu");
    }
  }

  function cancelDailyEdit() {
    setEditingDailyId(null);
    setDailyForm({
      date: "",
      meal_type: "Lunch",
      items: "",
    });
    setMsg("");
    setErr("");
  }

  function updateWeeklyField(day, meal, field, value) {
    setWeeklyItems((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: {
          ...prev[day][meal],
          [field]: value,
        },
      },
    }));
  }

  async function saveWeeklyMenu(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    try {
      const payload = {
        week_start: weekStart,
        weekly_items: weeklyItems,
      };

      const res = editingWeeklyId
        ? await api.put(`/menu/weekly/${editingWeeklyId}`, payload)
        : await api.post("/menu/weekly", payload);

      setMsg(
        res.data?.message ||
          (editingWeeklyId
            ? "Weekly menu updated successfully"
            : "Weekly menu saved successfully")
      );

      setEditingWeeklyId(null);
      setWeekStart(getCurrentWeekStart());
      setWeeklyItems(emptyWeeklyItems());
      loadWeeklyMenus();
    } catch (e) {
      console.error("Save weekly menu error", e);
      setErr(e?.response?.data?.error || "Failed to save weekly menu");
    }
  }

  function editWeeklyMenu(menu) {
    const next = emptyWeeklyItems();

    DAYS.forEach((day) => {
      MEALS.forEach((meal) => {
        next[day][meal] = {
          items: menu.weekly_items?.[day]?.[meal]?.items || "",
          price: String(menu.weekly_items?.[day]?.[meal]?.price ?? ""),
        };
      });
    });

    setEditingWeeklyId(menu.id);
    setWeekStart(menu.week_start || getCurrentWeekStart());
    setWeeklyItems(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteWeeklyMenu(menuId) {
    const ok = window.confirm("Are you sure you want to delete this weekly menu?");
    if (!ok) return;

    try {
      const res = await api.delete(`/menu/weekly/${menuId}`);
      setMsg(res.data?.message || "Weekly menu deleted successfully");

      if (editingWeeklyId === menuId) {
        cancelWeeklyEdit();
      }

      loadWeeklyMenus();
    } catch (e) {
      console.error("Delete weekly menu error", e);
      setErr(e?.response?.data?.error || "Failed to delete weekly menu");
    }
  }

  function cancelWeeklyEdit() {
    setEditingWeeklyId(null);
    setWeekStart(getCurrentWeekStart());
    setWeeklyItems(emptyWeeklyItems());
    setMsg("");
    setErr("");
  }

  const filteredWeeklyMenus = useMemo(() => {
    const q = weeklySearch.trim().toLowerCase();
    if (!q) return weeklyMenus;

    return weeklyMenus.filter((menu) => {
      const weekDates = getWeekDateMap(menu.week_start);

      const matchDay = DAYS.some((day) => {
        const dayDate = weekDates[day] || "";
        const mealsText = MEALS.map((meal) => {
          const entry = menu.weekly_items?.[day]?.[meal] || {};
          return `${entry.items || ""} ${entry.price ?? ""}`;
        }).join(" ");

        const haystack = `${day} ${dayDate} ${mealsText}`.toLowerCase();
        return haystack.includes(q);
      });

      return String(menu.week_start || "").toLowerCase().includes(q) || matchDay;
    });
  }, [weeklyMenus, weeklySearch]);

  return (
    <div className="menuPage">
      {(msg || err) && (
        <div className="card">
          {msg ? <p style={{ color: "#16a34a", fontWeight: 700 }}>{msg}</p> : null}
          {err ? <p style={{ color: "#ef4444", fontWeight: 700 }}>{err}</p> : null}
        </div>
      )}

      {canManage ? (
        <div className="grid menuTopGrid">
          <div className="card">
            <div className="menuSectionHeader">
              <div>
                <h1>{editingDailyId ? "Edit Daily Menu" : "Menu"}</h1>
              </div>
              {editingDailyId ? (
                <button className="btn btnOrange" type="button" onClick={cancelDailyEdit}>
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <form onSubmit={saveDailyMenu}>
              <input
                className="input"
                type="date"
                value={dailyForm.date}
                onChange={(e) =>
                  setDailyForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />

              <select
                className="input"
                value={dailyForm.meal_type}
                onChange={(e) =>
                  setDailyForm((prev) => ({ ...prev, meal_type: e.target.value }))
                }
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
              </select>

              <textarea
                className="input"
                rows="5"
                placeholder="Food items..."
                value={dailyForm.items}
                onChange={(e) =>
                  setDailyForm((prev) => ({ ...prev, items: e.target.value }))
                }
              />

              <button className="btn btnBlue" type="submit">
                {editingDailyId ? "Update Menu" : "Add Menu"}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Recent Menu</h2>

            {loadingRecent ? (
              <p className="muted">Loading...</p>
            ) : recentMenu.length === 0 ? (
              <p className="muted">No recent menu found.</p>
            ) : (
              <div className="menuListWrap">
                {recentMenu.slice(0, 10).map((m) => (
                  <div key={m.id} className="menuListCard">
                    <div>
                      <b>{m.date}</b> • {m.meal_type}
                      <p className="muted" style={{ marginTop: 6 }}>{m.items}</p>
                    </div>

                    <div className="row">
                      <button
                        className="btn btnBlue"
                        type="button"
                        onClick={() => editDailyMenu(m)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btnRed"
                        type="button"
                        onClick={() => deleteDailyMenu(m.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {canManage ? (
        <div className="card weekly-form-card">
          <div className="menuWeeklyHeader">
            <div>
              <h2>{editingWeeklyId ? "Edit Weekly Menu" : "Weekly Menu"}</h2>
              <p className="muted">Compact weekly form with cleaner layout</p>
            </div>

            {editingWeeklyId ? (
              <button className="btn btnOrange" type="button" onClick={cancelWeeklyEdit}>
                Cancel Edit
              </button>
            ) : null}
          </div>

          <form onSubmit={saveWeeklyMenu}>
            <div className="menuWeekStartWrap">
              <div className="menuWeekStartCard">
                <label className="menuLabel">Week Start Date</label>
                <input
                  className="input"
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </div>
            </div>

            <div className="weeklyMenuGrid compactWeeklyMenuGrid">
              {DAYS.map((day) => {
                const weekDates = getWeekDateMap(weekStart);

                return (
                  <div key={day} className="weeklyDayCard modernWeeklyDayCard">
                    <div className="weeklyDayCardHeader">
                      <div>
                        <h3>{day}</h3>
                        <span className="menuDayDate">{weekDates[day]}</span>
                      </div>
                      <div className="weeklyDayBadge"></div>
                    </div>

                    <div className="weeklyMealGrid">
                      {MEALS.map((meal) => (
                        <div key={meal} className="weeklyMealBlock modernMealBlock">
                          <div className="weeklyMealTop">
                            <span
                              className={`formMealBadge ${
                                meal === "Breakfast"
                                  ? "breakfast"
                                  : meal === "Lunch"
                                  ? "lunch"
                                  : "dinner"
                              }`}
                            >
                              {meal}
                            </span>
                          </div>

                          <textarea
                            className="input compactInput"
                            rows="2"
                            placeholder={`${meal} items`}
                            value={weeklyItems[day][meal].items}
                            onChange={(e) =>
                              updateWeeklyField(day, meal, "items", e.target.value)
                            }
                          />

                          <input
                            className="input compactInput"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={`${meal} price`}
                            value={weeklyItems[day][meal].price}
                            onChange={(e) =>
                              updateWeeklyField(day, meal, "price", e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="weeklyFormActionRow">
              <button className="btn btnBlue" type="submit">
                {editingWeeklyId ? "Update Weekly Menu" : "Save Weekly Menu"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="card weekly-menu-page">
        <div className="weekly-menu-header">
          <div>
            <h2 className="weekly-menu-title">Weekly Menu List</h2>
            <p className="weekly-menu-subtitle">
              Search by day name, date, item, or price. Example: Monday, 24-03-2026, Lunch
            </p>
            <span className="weekly-menu-updated">
              Compact, modern weekly menu view
            </span>
          </div>
        </div>

        <input
          className="input menuSearchInput"
          placeholder="Search weekly menu by day, date, item, or price..."
          value={weeklySearch}
          onChange={(e) => setWeeklySearch(e.target.value)}
        />

        {weeklyLoading ? (
          <div className="menu-loading">Loading weekly menu...</div>
        ) : filteredWeeklyMenus.length === 0 ? (
          <div className="menu-empty">
            {weeklySearch.trim()
              ? "No weekly menu found for this search."
              : "No weekly menu found."}
          </div>
        ) : (
          <div className="weeklyDisplayWrap">
            {filteredWeeklyMenus.map((menu) => {
              const weekDates = getWeekDateMap(menu.week_start);

              const visibleDays = DAYS.filter((day) => {
                const q = weeklySearch.trim().toLowerCase();
                if (!q) return true;

                const dayDate = String(weekDates[day] || "").toLowerCase();
                const mealsText = MEALS.map((meal) => {
                  const entry = menu.weekly_items?.[day]?.[meal] || {};
                  return `${meal} ${entry.items || ""} ${entry.price ?? ""}`;
                })
                  .join(" ")
                  .toLowerCase();

                const haystack = `${day.toLowerCase()} ${dayDate} ${mealsText}`;
                return haystack.includes(q);
              });

              return (
                <div key={menu.id} className="weeklyDisplayCard">
                  <div className="weeklyDisplayHeader">
                    <div>
                      <h3>Week Start: {menu.week_start}</h3>
                      <p className="muted">
                        Updated: {menu.updated_at ? formatDate(menu.updated_at) : "-"}
                      </p>
                    </div>

                    {canManage ? (
                      <div className="row">
                        <button
                          className="btn btnBlue"
                          type="button"
                          onClick={() => editWeeklyMenu(menu)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btnRed"
                          type="button"
                          onClick={() => deleteWeeklyMenu(menu.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="weekly-menu-grid">
                    {visibleDays.map((day) => (
                      <div key={day} className="menu-day-card">
                        <div className="menu-day-top">
                          <div>
                            <h3>{day}</h3>
                            <p>{weekDates[day]}</p>
                          </div>
                          <div className="menu-day-dot"></div>
                        </div>

                        <div className="meal-list">
                          {MEALS.map((meal) => {
                            const entry = menu.weekly_items?.[day]?.[meal] || {
                              items: "",
                              price: "",
                            };

                            const mealClass =
                              meal === "Breakfast"
                                ? "breakfast"
                                : meal === "Lunch"
                                ? "lunch"
                                : "dinner";

                            return (
                              <div key={meal} className="meal-item">
                                <div className="meal-title-row">
                                  <span className={`meal-badge ${mealClass}`}>{meal}</span>
                                  <span className="meal-price">
                                    ₹{" "}
                                    {entry.price !== "" && entry.price !== null
                                      ? entry.price
                                      : 0}
                                  </span>
                                </div>
                                <p>{entry.items || "Not added"}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function getWeekDateMap(weekStart) {
  const result = {};
  const start = new Date(weekStart);

  if (Number.isNaN(start.getTime())) {
    DAYS.forEach((day) => {
      result[day] = "";
    });
    return result;
  }

  DAYS.forEach((day, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    result[day] = formatShortDate(current);
  });

  return result;
}

function formatShortDate(dateObj) {
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}