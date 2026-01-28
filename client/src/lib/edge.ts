/**
 * Edge utility functions for the client
 * These provide client-side optimization helpers
 */

/**
 * Bot detection (basic)
 */
export function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];
  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Get geo-optimized API endpoint
 * In production, this could return different endpoints based on user location
 */
export function getOptimizedApiUrl(): string {
  return import.meta.env.VITE_API_URL || '/api';
}

/**
 * Performance observer for Core Web Vitals
 */
export function initPerformanceObserver(callback: (metric: PerformanceMetric) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      callback({
        name: 'LCP',
        value: lastEntry.startTime,
        rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor',
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch {
    // LCP not supported
  }

  // First Input Delay
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as PerformanceEventTiming[];
      const firstEntry = entries[0];
      if (firstEntry) {
        callback({
          name: 'FID',
          value: firstEntry.processingStart - firstEntry.startTime,
          rating: firstEntry.processingStart - firstEntry.startTime < 100 ? 'good' : 
                  firstEntry.processingStart - firstEntry.startTime < 300 ? 'needs-improvement' : 'poor',
        });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch {
    // FID not supported
  }

  // Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      callback({
        name: 'CLS',
        value: clsValue,
        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch {
    // CLS not supported
  }
}

/**
 * Prefetch a URL for faster navigation
 */
export function prefetchUrl(url: string): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Check if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if the user is on a slow connection
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  const connection = (navigator as NavigatorWithConnection).connection;
  if (!connection) return false;
  return connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

// Types
export interface PerformanceMetric {
  name: 'LCP' | 'FID' | 'CLS';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: {
    saveData: boolean;
    effectiveType: string;
  };
}
