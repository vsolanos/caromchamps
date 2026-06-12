import React, { useEffect, useState } from 'react';

const E = React.createElement;

let pushToast = null;
let pushConfirm = null;
let toastSeq = 0;

const TOAST_COLORS = {
  info: '#1d4ed8',
  success: '#15803d',
  warning: '#b45309',
  danger: '#b91c1c'
};

// Muestra un aviso no bloqueante. Reemplaza a window.alert.
export function notify(message, kind = 'info') {
  if (pushToast) pushToast({ id: `T-${Date.now()}-${toastSeq += 1}`, message: String(message), kind });
  else window.alert(message);
}

// Confirmación asíncrona. Reemplaza a window.confirm: `if (!(await confirmAction('...'))) return;`
export function confirmAction(message, { confirmLabel = 'Aceptar', cancelLabel = 'Cancelar' } = {}) {
  if (!pushConfirm) return Promise.resolve(window.confirm(message));
  return pushConfirm({ message: String(message), confirmLabel, cancelLabel });
}

const hostStyle = { position: 'fixed', top: 16, right: 16, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380 };
const toastStyle = (kind) => ({
  background: TOAST_COLORS[kind] || TOAST_COLORS.info,
  color: '#fff',
  padding: '10px 14px',
  borderRadius: 8,
  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
  fontSize: 14,
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  cursor: 'pointer'
});
const overlayStyle = { position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const dialogStyle = { background: 'var(--card-bg, #fff)', color: 'var(--text-color, #0f172a)', borderRadius: 12, padding: 20, maxWidth: 420, width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.35)' };
const dialogButtonsStyle = { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 };
const buttonStyle = (primary) => ({
  padding: '8px 16px',
  borderRadius: 8,
  border: primary ? 'none' : '1px solid #94a3b8',
  background: primary ? '#1d4ed8' : 'transparent',
  color: primary ? '#fff' : 'inherit',
  fontSize: 14,
  cursor: 'pointer'
});

// Montar una sola vez en la raíz de la app. Provee toasts y confirmaciones.
export function NotificationsHost() {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    pushToast = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 6000);
    };
    pushConfirm = ({ message, confirmLabel, cancelLabel }) => new Promise((resolve) => {
      setConfirmState({ message, confirmLabel, cancelLabel, resolve });
    });
    return () => { pushToast = null; pushConfirm = null; };
  }, []);

  const closeConfirm = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return E(React.Fragment, null,
    E('div', { style: hostStyle },
      toasts.map((toast) => E('div', {
        key: toast.id,
        style: toastStyle(toast.kind),
        onClick: () => setToasts((prev) => prev.filter((t) => t.id !== toast.id)),
        role: 'status'
      }, toast.message))
    ),
    confirmState ? E('div', { style: overlayStyle, onClick: () => closeConfirm(false) },
      E('div', { style: dialogStyle, onClick: (event) => event.stopPropagation(), role: 'dialog', 'aria-modal': true },
        E('p', { style: { margin: 0, whiteSpace: 'pre-wrap' } }, confirmState.message),
        E('div', { style: dialogButtonsStyle },
          E('button', { type: 'button', style: buttonStyle(false), onClick: () => closeConfirm(false) }, confirmState.cancelLabel),
          E('button', { type: 'button', style: buttonStyle(true), onClick: () => closeConfirm(true), autoFocus: true }, confirmState.confirmLabel)
        )
      )
    ) : null
  );
}
