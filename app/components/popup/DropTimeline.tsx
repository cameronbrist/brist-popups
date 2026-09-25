import {useEffect, useState} from 'react';
import {usePopup} from '~/lib/usePopup';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});

function remainingLabel(ms: number): string {
  const hours = Math.max(0, ms) / 3_600_000;
  if (hours >= 48) return `${Math.floor(hours / 24)} days left`;
  if (hours >= 1) return `${Math.floor(hours)} hours left`;
  return `${Math.max(1, Math.ceil(hours * 60))} minutes left`;
}

/**
 * Where the drop is in its window: opened, now, closes, ships.
 * The one question every pre-order buyer has, so it gets the hero.
 */
export function DropTimeline() {
  const {popup, drop} = usePopup();
  const {opensAt, closesAt} = popup;
  // Progress depends on the clock, so compute it after hydration.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!closesAt) return null;

  const start = opensAt ? Date.parse(opensAt) : null;
  const end = Date.parse(closesAt);
  let progress = 0;
  if (now !== null && start !== null && end > start) {
    progress = Math.min(1, Math.max(0, (now - start) / (end - start)));
  }
  if (drop.phase === 'closed') progress = 1;

  let status: string;
  if (drop.phase === 'upcoming') status = opensAt ? `Opens ${fmt(opensAt)}` : 'Opening soon';
  else if (drop.phase === 'live') status = now !== null ? remainingLabel(end - now) : 'Open now';
  else status = 'Closed';

  return (
    <div className="drop-timeline" data-phase={drop.phase}>
      <div className="drop-timeline-status">{status}</div>
      <div
        className="drop-timeline-track"
        role="progressbar"
        aria-label="Drop window"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className="drop-timeline-fill" style={{width: `${progress * 100}%`}} />
        {drop.phase === 'live' && (
          <div className="drop-timeline-now" style={{left: `${progress * 100}%`}} />
        )}
      </div>
      <div className="drop-timeline-labels">
        <span>{opensAt ? `${drop.phase === 'upcoming' ? 'Opens' : 'Opened'} ${fmt(opensAt)}` : ''}</span>
        <span>{`${drop.phase === 'closed' ? 'Closed' : 'Closes'} ${fmt(closesAt)}`}</span>
      </div>
      {popup.mode === 'preorder' && popup.shipMessage && (
        <p className="drop-timeline-ships">{popup.shipMessage}</p>
      )}
    </div>
  );
}
