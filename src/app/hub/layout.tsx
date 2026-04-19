import type { ReactNode } from 'react';
import '@/styles/marketing/hub-font.css';
import '@/styles/marketing/hub.css';

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
      />
      {children}
    </>
  );
}
