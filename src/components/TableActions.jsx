import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import './css/TableActions.css';

const TableActions = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="table-actions-container" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="table-actions-trigger"
        aria-label="More actions"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="table-actions-dropdown">
          {actions.map((action, index) => {
            if (!action) return null;
            
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className={`table-actions-item ${action.variant === 'danger' ? 'danger' : ''} ${action.disabled ? 'disabled' : ''}`}
              >
                {action.icon && <span className="action-icon">{action.icon}</span>}
                <span className="action-label">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TableActions;
