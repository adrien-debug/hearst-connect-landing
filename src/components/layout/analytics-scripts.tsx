'use client';

import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-5P2J64KGWL';
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? 'AW-18061841622';

export function AnalyticsScripts() {
  return (
    <>
      {/* Consentmanager (CMP) disabled per product decision.                  */}
      {/* GDPR / ePrivacy reminder: GA + Google Ads below collect identifiers. */}
      {/* Re-enable a CMP (or any consent flow) before serving EU/UK traffic.  */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');gtag('config','${GOOGLE_ADS_ID}');`}
      </Script>
    </>
  );
}
