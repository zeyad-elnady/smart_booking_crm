'use client';

import { Toaster, ToasterProps } from 'react-hot-toast';
import { useEffect, useState } from 'react';

/**
 * CustomToaster component that wraps react-hot-toast's Toaster
 * with hydration warning suppression to avoid issues with browser extensions
 * like Bitdefender that add bis_skin_checked attributes
 */
export default function CustomToaster(props: ToasterProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Wait for client-side render to avoid hydration mismatch
    setMounted(true);
    
    // Add MutationObserver to catch any elements with bis_skin_checked after mount
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
          // Remove the attribute added by browser extensions
          const target = mutation.target as HTMLElement;
          target.removeAttribute('bis_skin_checked');
        }
      });
    });
    
    // Start observing once mounted
    const toasterEl = document.getElementById('_rht_toaster');
    if (toasterEl) {
      observer.observe(toasterEl, { 
        attributes: true,
        subtree: true, 
        attributeFilter: ['bis_skin_checked'] 
      });
    }
    
    return () => observer.disconnect();
  }, []);
  
  // First render: return null on server, render on client only
  if (!mounted) {
    return null;
  }
  
  return (
    <Toaster 
      {...props}
      containerClassName="suppress-hydration-warning"
      containerStyle={{
        zIndex: 9999,
      }}
    />
  );
} 