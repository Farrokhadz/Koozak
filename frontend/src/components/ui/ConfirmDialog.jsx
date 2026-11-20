import { useState } from "react";
import Modal from "./Modal.jsx";
import { dangerButton, primaryButton, secondaryButton } from "./styles.js";

/**
 * Asks before doing something that can't be undone. `onConfirm` is async; when
 * it throws, the message is shown inside the dialog and the dialog stays open.
 */
export default function ConfirmDialog({
  title,
  children,
  confirmLabel,
  busyLabel = "در حال انجام...",
  danger = true,
  onConfirm,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal title={title} onClose={loading ? () => {} : onClose}>
      <div className="space-y-5">
        <div className="text-sm leading-7 text-text/80">{children}</div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`${danger ? dangerButton : primaryButton} flex-1`}
          >
            {loading ? busyLabel : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`${secondaryButton} flex-1`}
          >
            انصراف
          </button>
        </div>
      </div>
    </Modal>
  );
}
