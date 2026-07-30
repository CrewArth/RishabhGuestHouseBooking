import { useState, useRef, useEffect } from "react";
import { WIDGETS, getAllWidgetIds } from "../../common/widgetsConfig";
import api from "../../utils/api";
import { toast } from "react-toastify";
import "./allowWidgetsDropdown.css";

/**
 * A self-contained "Allow Widgets" button that opens a floating dropdown panel.
 * Clicking the trigger button toggles the panel; clicking outside closes it.
 *
 * Props:
 *   user        — the admin user object { _id, firstName, lastName, allowedWidgets }
 *   onSaved     — optional callback(updatedWidgets) after a successful save
 */
const AllowWidgetsDropdown = ({ user, onSaved }) => {
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [selected, setSelected] = useState(() =>
    Array.isArray(user?.allowedWidgets) ? user.allowedWidgets : getAllWidgetIds()
  );

  const containerRef = useRef(null);

  // Sync if the parent re-renders with fresh user data
  useEffect(() => {
    setSelected(
      Array.isArray(user?.allowedWidgets) ? user.allowedWidgets : getAllWidgetIds()
    );
  }, [user?.allowedWidgets]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (widgetId) =>
    setSelected((prev) =>
      prev.includes(widgetId) ? prev.filter((id) => id !== widgetId) : [...prev, widgetId]
    );

  const toggleAll = () => {
    const all = getAllWidgetIds();
    setSelected(selected.length === all.length ? [] : all);
  };

  const handleSave = async () => {
    if (!user?._id) return;
    setSaving(true);
    try {
      await api.patch(`/api/admin/users/${user._id}/widgets`, { allowedWidgets: selected });
      toast.success(`Widget access updated for ${user.firstName}`);
      onSaved?.(selected);
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update widgets");
    } finally {
      setSaving(false);
    }
  };

  const allSelected  = selected.length === WIDGETS.length;
  const noneSelected = selected.length === 0;

  return (
    <div className="aw-container" ref={containerRef}>
      {/* Trigger button */}
      <button
        className="btn-action aw-trigger"
        onClick={() => setOpen((v) => !v)}
        title="Manage widget access"
      >
        Widgets
        <span className="aw-badge">{selected.length}/{WIDGETS.length}</span>
        <span className="aw-caret">{open ? "▲" : "▼"}</span>
      </button>

      {/* Floating panel */}
      {open && (
        <div className="aw-panel">
          <div className="aw-panel-header">
            <span className="aw-panel-title">
              Widgets — <em>{user.firstName} {user.lastName}</em>
            </span>
            <button className="aw-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="aw-select-all-row">
            <label className="aw-check-label">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = !allSelected && !noneSelected; }}
                onChange={toggleAll}
              />
              <span>{allSelected ? "Deselect all" : "Select all"}</span>
            </label>
            <span className="aw-count">{selected.length} selected</span>
          </div>

          <div className="aw-widget-list">
            {WIDGETS.map((w) => (
              <label key={w.id} className={`aw-widget-item ${selected.includes(w.id) ? "checked" : ""}`}>
                <input
                  type="checkbox"
                  checked={selected.includes(w.id)}
                  onChange={() => toggle(w.id)}
                />
                <div className="aw-widget-info">
                  <span className="aw-widget-name">{w.name}</span>
                  <span className="aw-widget-desc">{w.description}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="aw-panel-footer">
            <button className="aw-btn-cancel" onClick={() => setOpen(false)}>Cancel</button>
            <button className="aw-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllowWidgetsDropdown;
