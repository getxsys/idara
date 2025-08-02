/**
 * Performance testing utilities for load and stress testing
 */

export interface PerformanceMetrics {
  duration: number
  memoryUsage: number
  cpuUsage?: number
  requestsPerSecond?: number
}

export class PerformanceTester {
  private metrics: PerformanceMetrics[] = []

  async measureFunction<T>(
    fn: () => Promise<T> | T,
    iterations: number = 1
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    const results: T[] = []
    const metrics: PerformanceMetrics[] = []

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()
      const startMemory = this.getMemoryUsage()

      const result = await fn()
      results.push(result)

      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()

      metrics.push({
        duration: endTime - startTime,
        memoryUsage: endMemory - startMemory
      })
    }

    const avgMetrics = this.calculateAverageMetrics(metrics)
    return {
      result: results[results.length - 1],
      metrics: avgMetrics
    }
  }

  async loadTest(
    fn: () => Promise<void> | void,
    concurrentUsers: number,
    duration: number
  ): Promise<PerformanceMetrics[]> {
    const startTime = Date.now()
    const promises: Promise<PerformanceMetrics>[] = []

    // Simulate concurrent users
    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.simulateUser(fn, duration))
    }

    return Promise.all(promises)
  }

  private async simulateUser(
    fn: () => Promise<void> | void,
    duration: number
  ): Promise<PerformanceMetrics> {
    const startTime = Date.now()
    const startMemory = this.getMemoryUsage()
    let requestCount = 0

    while (Date.now() - startTime < duration) {
      await fn()
      requestCount++
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    const endTime = Date.now()
    const endMemory = this.getMemoryUsage()

    return {
      duration: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      requestsPerSecond: requestCount / (duration / 1000)
    }
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  private calculateAverageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    const sum = metrics.reduce(
      (acc, metric) => ({
        duration: acc.duration + metric.duration,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        requestsPerSecond: (acc.requestsPerSecond || 0) + (metric.requestsPerSecond || 0)
      }),
      { duration: 0, memoryUsage: 0, requestsPerSecond: 0 }
    )

    return {
      duration: sum.duration / metrics.length,
      memoryUsage: sum.memoryUsage / metrics.length,
      requestsPerSecond: sum.requestsPerSecond / metrics.length
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  clearMetrics(): void {
    this.metrics = []
  }
}

// Performance thresholds for different operations
export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE: 500, // ms
  DATABASE_QUERY: 100, // ms
  UI_RENDER: 16, // ms (60fps)
  SEARCH_QUERY: 200, // ms
  AI_PROCESSING: 2000, // ms
  FILE_UPLOAD: 5000 // ms
}

// Helper function to assert performance
export const assertPerformance = (
  metrics: PerformanceMetrics,
  threshold: number,
  operation: string
) => {
  if (metrics.duration > threshold) {
    throw new Error(
      `Performance threshold exceeded for ${operation}: ${metrics.duration}ms > ${threshold}ms`
    )
  }
}