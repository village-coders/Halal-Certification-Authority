import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, X, ChevronRight, FileText, Calendar, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import './css/ImportantNotificationModal.css';

const baseUrl = import.meta.env.VITE_BASE_URL;

// ─── Action config per actionType ───────────────────────────────────────────
const ACTION_CONFIG = {
  view_invoice: {
    label: 'View Invoice',
    icon: FileText,
    colorClass: 'action-invoice',
    getRoute: (data) => `/invoices${data?.invoiceId ? `?highlight=${data.invoiceId}` : ''}`,
  },
  respond_audit_schedule: {
    label: 'Respond to Schedule',
    icon: Calendar,
    colorClass: 'action-audit-respond',
    getRoute: (data) => `/audits${data?.auditId ? `?action=respond&auditId=${data.auditId}` : ''}`,
  },
  upload_nc_correction: {
    label: 'Upload NC Correction',
    icon: Upload,
    colorClass: 'action-nc',
    getRoute: (data) => `/audits${data?.auditId ? `?action=nc_correction&auditId=${data.auditId}` : ''}`,
  },
  view_audit: {
    label: 'View Audit',
    icon: CheckCircle,
    colorClass: 'action-audit-view',
    getRoute: (data) => `/audits${data?.auditId ? `?highlight=${data.auditId}` : ''}`,
  },
};

// ─── Type badge config ───────────────────────────────────────────────────────
const TYPE_CONFIG = {
  invoice:     { label: 'Invoice',     bg: '#dbeafe', color: '#1d4ed8' },
  audit:       { label: 'Audit',       bg: '#fef9c3', color: '#a16207' },
  application: { label: 'Application', bg: '#dcfce7', color: '#15803d' },
  general:     { label: 'Notice',      bg: '#f3f4f6', color: '#374151' },
};

// ─── Single notification card ────────────────────────────────────────────────
const NotifCard = ({ notif, onTakeAction, onDismiss, loading }) => {
  const actionCfg = notif.actionType ? ACTION_CONFIG[notif.actionType] : null;
  const typeCfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
  const ActionIcon = actionCfg?.icon || null;

  return (
    <div className={`inm-card ${actionCfg ? `inm-card--${actionCfg.colorClass}` : ''}`}>
      {/* Top row: type badge + dismiss */}
      <div className="inm-card-header">
        <span
          className="inm-type-badge"
          style={{ background: typeCfg.bg, color: typeCfg.color }}
        >
          {typeCfg.label}
        </span>
        <button
          className="inm-card-dismiss"
          onClick={() => onDismiss(notif._id)}
          disabled={loading === notif._id}
          title="Dismiss this notification"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <h4 className="inm-card-title">{notif.title}</h4>
      <p className="inm-card-message">{notif.message}</p>
      <span className="inm-card-date">
        {new Date(notif.createdAt).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })}
      </span>

      {/* Action button */}
      {actionCfg && (
        <button
          className={`inm-action-btn inm-action-btn--${actionCfg.colorClass}`}
          onClick={() => onTakeAction(notif)}
          disabled={loading === notif._id}
        >
          {loading === notif._id ? (
            <span>Processing...</span>
          ) : (
            <>
              {ActionIcon && <ActionIcon size={15} />}
              <span>{actionCfg.label}</span>
              <ChevronRight size={15} />
            </>
          )}
        </button>
      )}
    </div>
  );
};

// ─── Main modal ──────────────────────────────────────────────────────────────
const ImportantNotificationModal = ({ notifications, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [isDismissingAll, setIsDismissingAll] = useState(false);
  const [localNotifs, setLocalNotifs] = useState(notifications || []);
  const navigate = useNavigate();

  // Sync if parent passes new notifications
  React.useEffect(() => {
    if (notifications && notifications.length > 0) {
      setLocalNotifs(notifications);
      setIsVisible(true);
    }
  }, [notifications]);

  const getToken = () => {
    const s = localStorage.getItem('accessToken');
    return s ? JSON.parse(s) : null;
  };

  // Dismiss a single notification without navigating
  const handleDismissSingle = useCallback(async (id) => {
    setLoadingId(id);
    try {
      const token = getToken();
      const res = await fetch(`${baseUrl}/notifications/user/dismiss-modal/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const remaining = localNotifs.filter(n => n._id !== id);
        setLocalNotifs(remaining);
        if (remaining.length === 0) {
          setIsVisible(false);
          if (onDismiss) onDismiss();
        }
      } else {
        toast.error('Failed to dismiss notification');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoadingId(null);
    }
  }, [localNotifs, onDismiss]);

  // Dismiss single notification AND navigate to action page
  const handleTakeAction = useCallback(async (notif) => {
    const actionCfg = ACTION_CONFIG[notif.actionType];
    if (!actionCfg) return;

    setLoadingId(notif._id);
    try {
      const token = getToken();
      await fetch(`${baseUrl}/notifications/user/dismiss-modal/${notif._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const remaining = localNotifs.filter(n => n._id !== notif._id);
      setLocalNotifs(remaining);
      if (remaining.length === 0) {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      }

      const route = actionCfg.getRoute(notif.actionData);
      navigate(route);
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoadingId(null);
    }
  }, [localNotifs, onDismiss, navigate]);

  // Dismiss ALL
  const handleDismissAll = useCallback(async () => {
    setIsDismissingAll(true);
    try {
      const token = getToken();
      const res = await fetch(`${baseUrl}/notifications/user/dismiss-modal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      } else {
        toast.error('Failed to dismiss notifications');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsDismissingAll(false);
    }
  }, [onDismiss]);

  if (!isVisible || !localNotifs || localNotifs.length === 0) return null;

  const actionableCount = localNotifs.filter(n => n.actionType).length;

  return (
    <div className="inm-overlay" role="dialog" aria-modal="true" aria-label="Important Updates">
      <div className="inm-panel">

        {/* ── Header ─────────────────────────────── */}
        <div className="inm-header">
          <div className="inm-header-left">
            <div className="inm-header-icon">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="inm-title">Action Required</h2>
              <p className="inm-subtitle">
                {localNotifs.length} update{localNotifs.length > 1 ? 's' : ''} need{localNotifs.length === 1 ? 's' : ''} your attention
              </p>
            </div>
          </div>
          <button
            className="inm-close-btn"
            onClick={handleDismissAll}
            disabled={isDismissingAll}
            aria-label="Dismiss all and close"
            title="Dismiss all"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Info strip ─────────────────────────── */}
        {actionableCount > 0 && (
          <div className="inm-info-strip">
            <BellRing size={14} />
            <span>{actionableCount} of these require your direct action. Click the button on each card.</span>
          </div>
        )}

        {/* ── Notification cards ─────────────────── */}
        <div className="inm-body">
          {localNotifs.map((notif, idx) => (
            <NotifCard
              key={notif._id || idx}
              notif={notif}
              onTakeAction={handleTakeAction}
              onDismiss={handleDismissSingle}
              loading={loadingId}
            />
          ))}
        </div>

        {/* ── Footer ─────────────────────────────── */}
        <div className="inm-footer">
          <button
            className="inm-dismiss-all-btn"
            onClick={handleDismissAll}
            disabled={isDismissingAll}
          >
            {isDismissingAll ? 'Dismissing...' : 'Dismiss All & Continue'}
            {!isDismissingAll && <ChevronRight size={16} />}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImportantNotificationModal;
