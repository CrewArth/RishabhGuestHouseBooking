import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

/**
 * Modal that lets a SUPER_ADMIN assign (or unassign) a guest house to an admin.
 * Props:
 *   user       – the admin user object
 *   onClose    – close callback
 *   onSuccess  – called after a successful assignment so the list can refresh
 */
export default function AssignGuestHouseModal({ user, onClose, onSuccess }) {
  const [guestHouses, setGuestHouses] = useState([]);
  const [selected, setSelected] = useState(
    user.assignedGuestHouseId?.guestHouseId || user.assignedGuestHouseId?._id || user.assignedGuestHouseId || ''
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/guesthouses')
      .then((res) => setGuestHouses(Array.isArray(res.data) ? res.data : res.data.guestHouses || []))
      .catch(() => toast.error('Unable to load guest houses'));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/api/admin/users/${user._id}/assign-guesthouse`, {
        guestHouseId: selected || null,
      });
      toast.success(selected ? 'Guest house assigned successfully' : 'Guest house unassigned');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign guest house');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="page-modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>

        <div className="page-modal-header">
          <h3>Assign Guest House</h3>
          <button className="page-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="page-modal-body">
          <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: '#64748b' }}>
            Admin: <strong style={{ color: '#1e293b' }}>{user.firstName} {user.lastName}</strong>
          </p>
          <label style={{ display: 'grid', gap: 6, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            Guest House
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 7, font: 'inherit' }}
            >
              <option value="">None (unassign)</option>
              {guestHouses.map((gh) => (
                <option key={gh._id} value={gh.guestHouseId || gh._id}>{gh.guestHouseName}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="page-modal-footer">
          <button className="btn-action edit" onClick={onClose}>Cancel</button>
          <button className="btn-action approve" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  );
}
