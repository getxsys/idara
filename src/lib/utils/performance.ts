/**
 * Performance monitoring utilities for the application
 */

// Performance metrics interface
export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Performance observer for monitoring
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Monitor navigation timing
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('page-load', navEntry.loadEventEnd - navEntry.fetchStart, {
            type: 'navigation',
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
          });
        }
      }
    });

    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric(`resource-${resourceEntry.initiatorType}`, entry.duration, {
            name: entry.name,
            size: resourceEntry.transferSize,
            cached: resourceEntry.transferSize === 0,
          });
        }
      }
    });

    // Monitor largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('largest-contentful-paint', entry.startTime, {
          element: (entry as any).element?.tagName,
          size: (entry as any).size,
        });
      }
    });

    // Monitor first input delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('first-input-delay', (entry as any).processingStart - entry.startTime, {
          inputType: (entry as any).name,
        });
      }
    });

    // Monitor cumulative layout shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordMetric('cumulative-layout-shift', clsValue);
    });

    try {
      navObserver.observe({ entryTypes: ['navigation'] });
      resourceObserver.observe({ entryTypes: ['resource'] });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      this.observers.push(navObserver, resourceObserver, lcpObserver, fidObserver, clsObserver);
    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }
  }

  private getFirstPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint?.startTime;
  }

  private getFirstContentfulPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp?.startTime;
  }

  recordMetric(name: string, duration: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetrics = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Send to analytics service (implement based on your analytics provider)
    this.sendToAnalytics(metric);
  }

  private sendToAnalytics(metric: PerformanceMetrics) {
    // Example implementation - replace with your analytics service
    if (process.env.NODE_ENV === 'production') {
      // Send to your analytics service
      console.log('Performance metric:', metric);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getMetricsByName(name: string): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  clearMetrics() {
    this.metrics = [];
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for manual performance tracking
export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
  });
}

export function measureSync<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
  }
}

// React hook for component performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  if (typeof window !== 'undefined') {
    const startTime = performance.now();
    
    return {
      recordRender: () => {
        const duration = performance.now() - startTime;
        performanceMonitor.recordMetric(`component-render-${componentName}`, duration);
      },
      recordInteraction: (interactionName: string) => {
        const interactionStart = performance.now();
        return () => {
          const duration = performance.now() - interactionStart;
          performanceMonitor.recordMetric(`interaction-${componentName}-${interactionName}`, duration);
        };
      },
    };
  }

  return {
    recordRender: () => {},
    recordInteraction: () => () => {},
  };
}

// Web Vitals monitoring
export function initializeWebVitals() {
  if (typeof window === 'undefined') return;

  // Monitor Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS((metric) => {
      performanceMonitor.recordMetric('web-vital-cls', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });

    getFID((metric) => {
      performanceMonitor.recordMetric('web-vital-fid', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });

    getFCP((metric) => {
      performanceMonitor.recordMetric('web-vital-fcp', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });

    getLCP((metric) => {
      performanceMonitor.recordMetric('web-vital-lcp', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });

    getTTFB((metric) => {
      performanceMonitor.recordMetric('web-vital-ttfb', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });
  }).catch(() => {
    console.warn('Web Vitals library not available');
  });
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  performanceMonitor.recordMetric('memory-usage', memory.usedJSHeapSize, {
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  });
}

// Network information monitoring
export function monitorNetworkInfo() {
  if (typeof window === 'undefined' || !('connection' in navigator)) return;

  const connection = (navigator as any).connection;
  performanceMonitor.recordMetric('network-info', 0, {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  });
}