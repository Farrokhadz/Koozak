import { useEffect, useRef } from "react";

export default function Modal({ title, onClose, children }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-text/30 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-lg sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-base font-semibold text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="-me-2 flex h-8 w-8 items-center justify-center rounded-full text-text/40 transition hover:bg-text/5 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
