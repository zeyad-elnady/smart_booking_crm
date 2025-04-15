'use client';

import dynamic from 'next/dynamic';

// Import ClearMockData component with no SSR
const ClearMockData = dynamic(() => import("@/components/ClearMockData"), { ssr: false });

export default function ClientWrapper() {
  return <ClearMockData />;
} 