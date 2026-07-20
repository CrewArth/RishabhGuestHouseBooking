import React from 'react';
import '../styles/guestHouseModal.css';

const ConfirmDeleteModal = ({ isOpen, title, message, onConfirm, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '400px', textAlign: 'center' }}>
        {/* Warning Icon */}
        <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fee2e2', marginBottom: '1.25rem' }}>
          <svg style={{ width: '28px', height: '28px', color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>

        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: '#111827', fontWeight: '700' }}>{title || "Confirm Delete"}</h2>
        <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5', marginBottom: '1.75rem', padding: '0 0.5rem' }}>
          {message || "Are you sure you want to delete this item? This action cannot be undone."}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button 
            type="button" 
            className="btn cancel" 
            style={{ minWidth: '100px' }} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn" 
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white', 
              minWidth: '100px',
              transition: 'background-color 0.2s ease-in-out'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
