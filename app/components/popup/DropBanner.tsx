import {useEffect, useState} from 'react';
import {useRevalidator} from 'react-router';
import {usePopup} from '~/lib/usePopup';

function formatRemaining(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
}

/**
 * Drop status bar. Counts down to the next phase change and revalidates the
 * root loader when it hits zero, so the page flips from "opens in" to "live"
 * (or "live" to "closed") without a manual refresh.
 */
export function DropBanner() {
  const {drop} = usePopup();
  const revalidator = useRevalidator();
  const target = drop.nextChangeAt ? Date.parse(drop.nextChangeAt) : null;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    setNow(Date.now());
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= target) {
        clearInterval(id);
        void revalidator.revalidate();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Render the countdown only after hydration to avoid server/client time mismatch.
  const remaining = target !== null && now !== null ? formatRemaining(target - now) : null;

  let message: string;
  if (drop.phase === 'upcoming') {
    message = remaining ? `Opens in ${remaining}` : 'Opening soon';
  } else if (drop.phase === 'live') {
    message = remaining ? `Open now. Closes in ${remaining}` : 'Open now';
  } else {
    message = 'This drop is closed';
  }

  return (
    <div className="drop-banner" data-phase={drop.phase} role="status">
      {message}
    </div>
  );
}
