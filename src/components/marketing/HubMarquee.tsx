import Image from 'next/image';

const ICONS = [
  { name: 'Bitcoin', src: '/icons/crypto/btc.png' },
  { name: 'Ethereum', src: '/icons/crypto/eth.png' },
  { name: 'USDC', src: '/icons/crypto/usdc.png' },
  { name: 'Tether', src: '/icons/crypto/usdt.png' },
  { name: 'BNB', src: '/icons/crypto/bnb.png' },
  { name: 'Solana', src: '/icons/crypto/sol.png' },
  { name: 'XRP', src: '/icons/crypto/xrp.png' },
  { name: 'Cardano', src: '/icons/crypto/ada.png' },
  { name: 'Avalanche', src: '/icons/crypto/avax.png' },
  { name: 'Dogecoin', src: '/icons/crypto/doge.png' },
  { name: 'Polkadot', src: '/icons/crypto/dot.png' },
  { name: 'Chainlink', src: '/icons/crypto/link.png' },
  { name: 'Polygon', src: '/icons/crypto/matic.png' },
  { name: 'TRON', src: '/icons/crypto/trx.png' },
] as const;

export function HubMarquee() {
  return (
    <section id="intro" lang="en">
      <div className="hub-section-lead">
        <h2>
          <span className="typewriter"><span className="hub-lead-accent">Hearst Connect</span> brings industrial Bitcoin mining cash flows on-chain. USDC vaults backed by real hashrate, institutional controls, and transparent reporting — built for qualified allocators.</span>
        </h2>
      </div>

      <div className="icons">
        {/* icons-marquee-strip : conteneur animé, 3 copies pour boucle seamless */}
        <div className="icons-marquee-strip">
          {[0, 1, 2].map((copy) => (
            <div key={copy} className="icons-track" aria-hidden={copy > 0}>
              {ICONS.map((icon, i) => (
                <div key={`${icon.name}-${copy}-${i}`} className="icon">
                  <Image
                    src={icon.src}
                    alt={copy === 0 ? icon.name : ''}
                    className="icon-img"
                    width={480}
                    height={200}
                    quality={100}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
