import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateSiteSettings, resetSiteSettings } from '../../redux/siteSettingsSlice';
import '../styles/settings.css';
import fallbackLogo from '../../assets/logo.png';
import { WIDGETS, getAllWidgetIds } from '../../common/widgetsConfig';
import api from '../../utils/api';

export default function Settings() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'admin';

  const { siteName, logoUrl } = useSelector((state) => state.siteSettings);

  const [nameInput, setNameInput] = useState(siteName);
  const [previewUrl, setPreviewUrl] = useState(logoUrl);
  const [logoFile, setLogoFile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  /* ── Allow Widgets state ── */
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [savingWidgets, setSavingWidgets] = useState(false);
  const [widgetSuccess, setWidgetSuccess] = useState('');
  const [widgetError, setWidgetError] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      api.get('/api/admin/users?limit=100')
        .then((res) => {
          const list = res.data?.users || [];
          setAdminUsers(list);
          if (list.length > 0) {
            setSelectedAdminId(list[0]._id);
            const userWidgets = list[0].allowedWidgets;
            setSelectedWidgets(Array.isArray(userWidgets) ? userWidgets : getAllWidgetIds());
          }
        })
        .catch((err) => console.error('Failed to load admin list for widget settings:', err));
    }
  }, [isSuperAdmin]);

  const handleAdminChange = (adminId) => {
    setSelectedAdminId(adminId);
    setWidgetSuccess('');
    setWidgetError('');
    const targetUser = adminUsers.find((u) => u._id === adminId);
    if (targetUser) {
      const userWidgets = targetUser.allowedWidgets;
      setSelectedWidgets(Array.isArray(userWidgets) ? userWidgets : getAllWidgetIds());
    }
  };

  const handleToggleWidget = (widgetId) => {
    setSelectedWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleToggleSelectAll = () => {
    const allIds = getAllWidgetIds();
    if (selectedWidgets.length === allIds.length) {
      setSelectedWidgets([]);
    } else {
      setSelectedWidgets(allIds);
    }
  };

  const handleSaveWidgets = async () => {
    if (!selectedAdminId) return;
    setSavingWidgets(true);
    setWidgetSuccess('');
    setWidgetError('');

    try {
      await api.patch(`/api/admin/users/${selectedAdminId}/widgets`, {
        allowedWidgets: selectedWidgets,
      });

      setAdminUsers((prev) =>
        prev.map((u) =>
          u._id === selectedAdminId
            ? { ...u, allowedWidgets: selectedWidgets }
            : u
        )
      );

      setWidgetSuccess('✓ Widget permissions saved successfully!');
      setTimeout(() => setWidgetSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save widget permissions:', err);
      setWidgetError(err.response?.data?.error || 'Failed to update widget permissions.');
    } finally {
      setSavingWidgets(false);
    }
  };

  /* ── Logo file selection ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, SVG, WebP, etc.).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB.');
      return;
    }

    setError('');
    setLogoFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  /* ── Remove selected / current logo ── */
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Save ── */
  const handleSave = () => {
    if (!nameInput.trim()) {
      setError('Site name cannot be empty.');
      return;
    }

    setError('');

    dispatch(
      updateSiteSettings({
        siteName: nameInput.trim(),
        logoUrl: previewUrl,
      })
    );

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  /* ── Reset to defaults ── */
  const handleReset = () => {
    dispatch(resetSiteSettings());
    setNameInput('Arth Guest House');
    setPreviewUrl(null);
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1 className="settings-title">Site Settings</h1>
        <p className="settings-subtitle">
          Customise the navbar logo, site name, and widget permissions. Changes apply instantly.
        </p>
      </header>

      {/* ── Live preview ── */}
      <section className="settings-card">
        <h2 className="settings-card-title">Live Preview</h2>
        <div className="settings-preview-bar">
          <img
            src={previewUrl || fallbackLogo}
            alt="Logo preview"
            className="settings-preview-logo"
          />
          <span className="settings-preview-name">
            {nameInput.trim() || 'Site Name'}
          </span>
        </div>
      </section>

      {/* ── Logo upload ── */}
      <section className="settings-card">
        <h2 className="settings-card-title">Navbar Logo</h2>
        <p className="settings-card-desc">
          Recommended: square image, at least 100 × 100 px. Max 2 MB. PNG / SVG / WebP preferred.
        </p>

        <div className="settings-logo-row">
          <img
            src={previewUrl || fallbackLogo}
            alt="Current logo"
            className="settings-current-logo"
          />

          <div className="settings-logo-actions">
            <label className="settings-upload-btn" htmlFor="logo-upload">
              {logoFile ? 'Change Image' : 'Upload Image'}
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="settings-file-input"
            />

            {previewUrl && (
              <button
                type="button"
                className="settings-remove-btn"
                onClick={handleRemoveLogo}
              >
                Remove Logo
              </button>
            )}
          </div>
        </div>

        {logoFile && (
          <p className="settings-file-name">Selected: {logoFile.name}</p>
        )}
      </section>

      {/* ── Site name ── */}
      <section className="settings-card">
        <h2 className="settings-card-title">Site Name</h2>
        <p className="settings-card-desc">
          Displayed in the navbar next to the logo.
        </p>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => {
            setNameInput(e.target.value);
            setSaved(false);
          }}
          placeholder="Enter site name…"
          className="settings-text-input"
          maxLength={60}
        />
        <span className="settings-char-count">{nameInput.length} / 60</span>
      </section>

      {/* ── Allow Widgets (Super Admin Only) ── */}
      {isSuperAdmin && (
        <section className="settings-card">
          <h2 className="settings-card-title">Allow Widgets</h2>
          <p className="settings-card-desc">
            Select an admin account and customize which dashboard widgets they are allowed to view.
          </p>

          {adminUsers.length === 0 ? (
            <p className="settings-card-desc" style={{ fontStyle: 'italic' }}>
              Loading admin accounts…
            </p>
          ) : (
            <>
              <label className="settings-card-title" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>
                Select Admin Account:
              </label>
              <select
                value={selectedAdminId}
                onChange={(e) => handleAdminChange(e.target.value)}
                className="settings-admin-select"
              >
                {adminUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.firstName} {u.lastName} ({u.email}) — [{u.role || 'ADMIN'}]
                  </option>
                ))}
              </select>

              <div className="widget-list-header">
                <span className="widget-list-title">
                  Assigned Widgets ({selectedWidgets.length} / {WIDGETS.length}):
                </span>
                <button
                  type="button"
                  className="widget-select-toggle-btn"
                  onClick={handleToggleSelectAll}
                >
                  {selectedWidgets.length === WIDGETS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="widget-grid">
                {WIDGETS.map((widget) => {
                  const isChecked = selectedWidgets.includes(widget.id);
                  return (
                    <div
                      key={widget.id}
                      className={`widget-item-card ${isChecked ? 'selected' : ''}`}
                      onClick={() => handleToggleWidget(widget.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="widget-checkbox"
                      />
                      <div className="widget-info">
                        <span className="widget-name">{widget.name}</span>
                        <span className="widget-desc">{widget.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {widgetError && <p className="settings-error" style={{ marginTop: '1rem' }}>{widgetError}</p>}
              {widgetSuccess && <p className="settings-success" style={{ marginTop: '1rem' }}>{widgetSuccess}</p>}

              <button
                type="button"
                className="widget-save-btn"
                onClick={handleSaveWidgets}
                disabled={savingWidgets}
              >
                {savingWidgets ? 'Saving…' : 'Save Widget Access'}
              </button>
            </>
          )}
        </section>
      )}

      {/* ── Error / success ── */}
      {error && <p className="settings-error">{error}</p>}
      {saved && <p className="settings-success">✓ Settings saved successfully!</p>}

      {/* ── Actions ── */}
      <div className="settings-actions">
        <button className="settings-save-btn" onClick={handleSave}>
          Save Changes
        </button>
        <button className="settings-reset-btn" onClick={handleReset}>
          Reset to Default
        </button>
      </div>
    </div>
  );
}
