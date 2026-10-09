import { useStore } from '../../store/useStore';

export default function ToastContainer() {
  const { toasts } = useStore();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type || 'success'}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
