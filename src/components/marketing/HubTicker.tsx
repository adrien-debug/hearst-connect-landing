'use client';

const TICKER_ITEMS = [
  'BTC/USD $64,230.00 (+2.4%)',
  'Network Hashrate: 620 EH/s',
  'Next Difficulty Retarget: 4d 12h',
  'Last Block Mined: 2 mins ago',
  'Total Value Locked: $142.5M',
  'Prime APY: 12.00%',
  'Growth APY: 15.00%',
] as const;

export function HubTicker() {
  return (
    <div className="hub-ticker-container" aria-hidden>
      <div className="hub-ticker-track">
        <div className="hub-ticker-content">
          {TICKER_ITEMS.map((item, i) => (
            <span key={`a-${i}`} className="hub-ticker-item">
              <span className="hub-ticker-dot" />
              {item}
            </span>
          ))}
        </div>
        <div className="hub-ticker-content">
          {TICKER_ITEMS.map((item, i) => (
            <span key={`b-${i}`} className="hub-ticker-item">
              <span className="hub-ticker-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
