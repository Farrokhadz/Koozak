import { useState, useSyncExternalStore } from "react";
import Modal from "./Modal.jsx";
import { primaryButton, secondaryButton } from "./styles.js";
import {
  canPrompt,
  isIos,
  isStandalone,
  promptInstall,
  subscribe,
} from "../../utils/pwaInstall.js";

/**
 * "Install app" button. Android/desktop Chrome: opens the native install
 * dialog in one tap. iOS Safari: shows how to use "Add to Home Screen".
 * Renders nothing when the app is already installed or can't be installed.
 */
export default function InstallAppButton({ className = "" }) {
  const promptReady = useSyncExternalStore(subscribe, canPrompt);
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (isStandalone()) return null;

  const ios = !promptReady && isIos();
  if (!promptReady && !ios) return null;

  const handleClick = () => {
    if (ios) setShowIosHelp(true);
    else promptInstall();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${secondaryButton} inline-flex items-center gap-2 px-4 py-2 text-sm ${className}`}
      >
        <span aria-hidden="true">⬇</span>
        نصب اپلیکیشن
      </button>

      {showIosHelp ? (
        <Modal title="نصب کوزک روی آیفون" onClose={() => setShowIosHelp(false)}>
          <ol className="list-inside list-decimal space-y-3 text-sm leading-7">
            <li>
              این صفحه را در مرورگر <strong>Safari</strong> باز کنید.
            </li>
            <li>
              دکمه <strong>اشتراک‌گذاری</strong> (Share) را در پایین صفحه بزنید.
            </li>
            <li>
              گزینه <strong>Add to Home Screen</strong> را انتخاب کنید.
            </li>
            <li>
              روی <strong>Add</strong> بزنید تا آیکون کوزک به صفحه اصلی اضافه شود.
            </li>
          </ol>
          <button
            type="button"
            onClick={() => setShowIosHelp(false)}
            className={`${primaryButton} mt-6 w-full`}
          >
            متوجه شدم
          </button>
        </Modal>
      ) : null}
    </>
  );
}
