'use client';

import { useState, useEffect } from 'react';

export default function BrowserInfo() {
  const [browserInfo, setBrowserInfo] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Get browser information
    const info: Record<string, string> = {
      'User Agent': window.navigator.userAgent,
      'Browser': getBrowserName(),
      'Screen Resolution': `${window.screen.width}x${window.screen.height}`,
      'Viewport Size': `${window.innerWidth}x${window.innerHeight}`,
      'Connection Type': (navigator as any).connection?.effectiveType || 'Unknown',
      'Online Status': navigator.onLine ? 'Online' : 'Offline',
      'Cookies Enabled': navigator.cookieEnabled ? 'Yes' : 'No',
      'Do Not Track': navigator.doNotTrack ? 'Enabled' : 'Disabled',
      'Location Services': 'geolocation' in navigator ? 'Available' : 'Unavailable',
      'Time Zone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    setBrowserInfo(info);
  }, []);
  
  // Helper function to get browser name from user agent
  function getBrowserName(): string {
    const userAgent = window.navigator.userAgent;
    let browserName = 'Unknown';
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
      browserName = 'Chrome';
    } else if (userAgent.match(/firefox|fxios/i)) {
      browserName = 'Firefox';
    } else if (userAgent.match(/safari/i)) {
      browserName = 'Safari';
    } else if (userAgent.match(/opr\//i)) {
      browserName = 'Opera';
    } else if (userAgent.match(/edg/i)) {
      browserName = 'Edge';
    } else if (userAgent.match(/msie|trident/i)) {
      browserName = 'Internet Explorer';
    }
    
    return browserName;
  }

  return (
    <div className="text-sm">
      {Object.keys(browserInfo).length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(browserInfo).map(([key, value]) => (
            <div key={key} className="contents">
              <div className="text-gray-500">{key}:</div>
              <div className="truncate" title={value}>{value}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Loading browser information...</p>
      )}
    </div>
  );
} 