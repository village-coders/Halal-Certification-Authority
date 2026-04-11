import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import './css/TableActions.css';

const TableActions = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && buttonRef.current.contains(event.target)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setIsOpen(!isOpen);
  };

  const portalContent = isOpen && (
    <div 
      ref={dropdownRef}
      className="table-actions-dropdown"
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
        zIndex: 99999,
        margin: 0
      }}
    >
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
  );

  return (
    <div className="table-actions-container">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="table-actions-trigger"
        aria-label="More actions"
      >
        <MoreVertical size={18} />
      </button>

      {typeof document !== 'undefined' ? createPortal(portalContent, document.body) : portalContent}
    </div>
  );
};

export default TableActions;
