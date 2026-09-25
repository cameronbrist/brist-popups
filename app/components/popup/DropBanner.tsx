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

  // Countdown renders only after hydration to avoid server/client time mismatch.
  const remaining = target !== null && now !== null ? formatRemaining(target - now) : null;

  let lead: string;
  let time: string | null = remaining;
  if (drop.phase === 'upcoming') {
    lead = remaining ? 'Opens in' : 'Opening soon';
  } else if (drop.phase === 'live') {
    lead = remaining ? 'Open now. Closes in' : 'Open now';
  } else {
    lead = 'This drop is closed';
    time = null;
  }

  return (
    <div className="drop-banner" data-phase={drop.phase} role="status">
      {lead}
      {time && <span className="drop-banner-time">&nbsp;{time}</span>}
    </div>
  );
}
