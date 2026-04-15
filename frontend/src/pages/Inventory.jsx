import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

const CATEGORY_OPTIONS = [
  "Vegetables",
  "Fruits",
  "Groceries",
  "Spices",
  "Dairy",
  "Grains",
  "Beverages",
  "Cleaning",
  "Gas cylinders",
];

const UNIT_OPTIONS = ["kg", "litre", "pcs", "pack", "bag", "cylinder"];

const emptyForm = {
  category: "Vegetables",
  name: "",
  unit: "kg",
  qty: "",
  low_limit: "5",
  price_per_unit: "",
};

function num(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function Inventory() {
  const u = getUser();
  const canManage = u?.role === "Admin" || u?.role === "Staff";

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total_items: 0,
    total_quantity: 0,
    low_stock: 0,
    out_of_stock: 0,
    total_value: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [itemsRes, summaryRes] = await Promise.all([
        api.get("/inventory"),
        api.get("/inventory/summary"),
      ]);
      setItems(itemsRes.data || []);
      setSummary(
        summaryRes.data || {
          total_items: 0,
          total_quantity: 0,
          low_stock: 0,
          out_of_stock: 0,
          total_value: 0,
        }
      );
    } catch (err) {
      console.error("Inventory load failed", err);
      alert(err?.response?.data?.error || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!canManage) return;

    const payload = {
      category: form.category.trim(),
      name: form.name.trim(),
      unit: form.unit.trim(),
      qty: num(form.qty),
      low_limit: num(form.low_limit),
      price_per_unit: num(form.price_per_unit),
    };

    if (!payload.category || !payload.name) {
      alert("Category and item name are required");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/inventory/${editingId}`, payload);
        alert("Inventory updated successfully");
      } else {
        await api.post("/inventory", payload);
        alert("Inventory added successfully");
      }

      resetForm();
      load();
    } catch (err) {
      console.error("Inventory save failed", err);
      alert(err?.response?.data?.error || "Failed to save inventory");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      category: item.category || "Vegetables",
      name: item.name || "",
      unit: item.unit || "kg",
      qty: String(item.qty ?? ""),
      low_limit: String(item.low_limit ?? 5),
      price_per_unit: String(item.price_per_unit ?? 0),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!canManage) return;
    const ok = window.confirm("Are you sure you want to delete this inventory item?");
    if (!ok) return;

    try {
      await api.delete(`/inventory/${id}`);
      alert("Inventory item deleted");
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      console.error("Delete failed", err);
      alert(err?.response?.data?.error || "Failed to delete item");
    }
  }

  async function adjustQty(id, delta) {
    if (!canManage) return;

    try {
      await api.patch(`/inventory/${id}/adjust`, { qty_delta: delta });
      load();
    } catch (err) {
      console.error("Quantity update failed", err);
      alert(err?.response?.data?.error || "Failed to update quantity");
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.unit?.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const availableCategories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  return (
    <div className="inventoryPage">
      <div className="grid inventoryTopGrid">
        <div className="card">
          <div className="inventoryHeader">
            <div>
              <h2>{editingId ? "Edit Inventory Item" : "Inventory Management"}</h2>
              <p className="muted">
                Add, update, track, and manage stock items.
              </p>
            </div>
            {editingId ? (
              <button className="btn btnOrange" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>

          {!canManage ? (
            <p className="muted">Only Admin/Staff can manage inventory.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="inventoryFormGrid">
                <div>
                  <label className="inventoryLabel">Category</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="inventoryLabel">Item name</label>
                  <input
                    className="input"
                    placeholder="e.g. Onion"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                  />
                </div>

                <div>
                  <label className="inventoryLabel">Unit</label>
                  <select
                    className="input"
                    value={form.unit}
                    onChange={(e) => updateForm("unit", e.target.value)}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="inventoryLabel">Quantity</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={form.qty}
                    onChange={(e) => updateForm("qty", e.target.value)}
                  />
                </div>

                <div>
                  <label className="inventoryLabel">Low stock limit</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="5"
                    value={form.low_limit}
                    onChange={(e) => updateForm("low_limit", e.target.value)}
                  />
                </div>

                <div>
                  <label className="inventoryLabel">Price per unit (₹)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={form.price_per_unit}
                    onChange={(e) => updateForm("price_per_unit", e.target.value)}
                  />
                </div>
              </div>

              <div className="inventoryActionRow">
                <button className="btn btnBlue" type="submit" disabled={saving}>
                  {saving
                    ? editingId
                      ? "Updating..."
                      : "Adding..."
                    : editingId
                    ? "Update Item"
                    : "Add Item"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card">
          <h3>Inventory Summary</h3>
          <div className="inventorySummaryGrid">
            <div className="inventorySummaryBox">
              <span className="inventorySummaryTitle">Total Items</span>
              <strong>{summary.total_items}</strong>
            </div>

            <div className="inventorySummaryBox">
              <span className="inventorySummaryTitle">Total Quantity</span>
              <strong>{summary.total_quantity}</strong>
            </div>

            <div className="inventorySummaryBox">
              <span className="inventorySummaryTitle">Low Stock</span>
              <strong>{summary.low_stock}</strong>
            </div>

            <div className="inventorySummaryBox">
              <span className="inventorySummaryTitle">Out of Stock</span>
              <strong>{summary.out_of_stock}</strong>
            </div>

            <div className="inventorySummaryBox inventorySummaryWide">
              <span className="inventorySummaryTitle">Total Stock Value</span>
              <strong>₹ {Number(summary.total_value || 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="inventoryToolbar">
          <div>
            <h3>Stock List</h3>
            <p className="muted">Search, filter, and manage all items.</p>
          </div>
        </div>

        <div className="inventoryFilterGrid">
          <input
            className="input"
            placeholder="Search by item, category, unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {availableCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
        </div>

        {loading ? (
          <p className="muted">Loading inventory...</p>
        ) : filteredItems.length === 0 ? (
          <p className="muted">No inventory items found.</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Low Limit</th>
                  <th>Price/Unit</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Updated</th>
                  {canManage ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <div className="muted" style={{ fontSize: 13 }}>
                        Unit: {item.unit || "-"}
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <div className="inventoryQtyCell">
                        {canManage ? (
                          <button
                            className="inventoryQtyBtn"
                            onClick={() => adjustQty(item.id, -1)}
                            type="button"
                          >
                            -
                          </button>
                        ) : null}

                        <span className="inventoryQtyValue">
                          {Number(item.qty).toFixed(2)}
                        </span>

                        {canManage ? (
                          <button
                            className="inventoryQtyBtn"
                            onClick={() => adjustQty(item.id, 1)}
                            type="button"
                          >
                            +
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td>{Number(item.low_limit).toFixed(2)}</td>
                    <td>₹ {Number(item.price_per_unit || 0).toFixed(2)}</td>
                    <td>₹ {Number(item.total_value || 0).toFixed(2)}</td>
                    <td>
                      <span
                        className={`inventoryStatusBadge ${
                          item.status === "Out of Stock"
                            ? "inventoryStatusOut"
                            : item.status === "Low Stock"
                            ? "inventoryStatusLow"
                            : "inventoryStatusGood"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{formatDateTime(item.updated_at)}</td>

                    {canManage ? (
                      <td>
                        <div className="row">
                          <button
                            className="btn btnBlue"
                            type="button"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btnRed"
                            type="button"
                            onClick={() => handleDelete(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}