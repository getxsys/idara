/**
 * Accessibility testing utilities for WCAG compliance
 * Provides tools for testing screen reader compatibility, keyboard navigation, and inclusive design
 */

import { Page } from '@playwright/test'

export interface AccessibilityTestResult {
  violations: AccessibilityViolation[]
  passes: AccessibilityPass[]
  incomplete: AccessibilityIncomplete[]
  inapplicable: AccessibilityInapplicable[]
}

export interface AccessibilityViolation {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  help: string
  helpUrl: string
  nodes: AccessibilityNode[]
}

export interface AccessibilityPass {
  id: string
  description: string
  nodes: AccessibilityNode[]
}

export interface AccessibilityIncomplete {
  id: string
  description: string
  nodes: AccessibilityNode[]
}

export interface AccessibilityInapplicable {
  id: string
  description: string
}

export interface AccessibilityNode {
  target: string[]
  html: string
  impact?: 'minor' | 'moderate' | 'serious' | 'critical'
  any: AccessibilityCheck[]
  all: AccessibilityCheck[]
  none: AccessibilityCheck[]
}

export interface AccessibilityCheck {
  id: string
  impact: string
  message: string
  data: any
}

export class AccessibilityTester {
  constructor(private page: Page) {}

  async runAxeAnalysis(
    selector?: string,
    options?: {
      tags?: string[]
      rules?: Record<string, { enabled: boolean }>
    }
  ): Promise<AccessibilityTestResult> {
    // Inject axe-core into the page
    await this.page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.8.2/axe.min.js'
    })

    // Run axe analysis
    const results = await this.page.evaluate(
      ({ selector, options }) => {
        return new Promise((resolve) => {
          // @ts-ignore - axe is injected globally
          window.axe.run(selector || document, options || {}, (err: any, results: any) => {
            if (err) throw err
            resolve(results)
          })
        })
      },
      { selector, options }
    )

    return results as AccessibilityTestResult
  }

  async testKeyboardNavigation(): Promise<{
    focusableElements: string[]
    tabOrder: string[]
    trapsFocus: boolean
  }> {
    const result = await this.page.evaluate(() => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ]

      const focusableElements = Array.from(
        document.querySelectorAll(focusableSelectors.join(', '))
      ).map(el => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''))

      // Test tab order
      const tabOrder: string[] = []
      let currentElement = document.activeElement

      // Simulate tab navigation
      for (let i = 0; i < focusableElements.length; i++) {
        const event = new KeyboardEvent('keydown', {
          key: 'Tab',
          code: 'Tab',
          keyCode: 9,
          bubbles: true
        })
        document.dispatchEvent(event)
        
        if (document.activeElement && document.activeElement !== currentElement) {
          const el = document.activeElement
          tabOrder.push(el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''))
          currentElement = document.activeElement
        }
      }

      return {
        focusableElements,
        tabOrder,
        trapsFocus: tabOrder.length > 0 && tabOrder[0] === tabOrder[tabOrder.length - 1]
      }
    })

    return result
  }

  async testScreenReaderCompatibility(): Promise<{
    hasAriaLabels: boolean
    hasHeadingStructure: boolean
    hasLandmarks: boolean
    hasAltText: boolean
  }> {
    const result = await this.page.evaluate(() => {
      // Check for ARIA labels
      const elementsNeedingLabels = document.querySelectorAll(
        'input, button, select, textarea'
      )
      const hasAriaLabels = Array.from(elementsNeedingLabels).every(el => 
        el.hasAttribute('aria-label') || 
        el.hasAttribute('aria-labelledby') ||
        el.hasAttribute('title') ||
        (el as HTMLElement).textContent?.trim()
      )

      // Check heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const hasHeadingStructure = headings.length > 0

      // Check for landmarks
      const landmarks = document.querySelectorAll(
        'main, nav, aside, header, footer, section, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]'
      )
      const hasLandmarks = landmarks.length > 0

      // Check for alt text on images
      const images = document.querySelectorAll('img')
      const hasAltText = Array.from(images).every(img => 
        img.hasAttribute('alt') || img.hasAttribute('aria-label')
      )

      return {
        hasAriaLabels,
        hasHeadingStructure,
        hasLandmarks,
        hasAltText
      }
    })

    return result
  }

  async testColorContrast(): Promise<{
    violations: Array<{
      element: string
      foreground: string
      background: string
      ratio: number
      required: number
    }>
  }> {
    // This would typically use a color contrast analyzer
    // For now, we'll return a mock implementation
    const violations = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      const violations: Array<{
        element: string
        foreground: string
        background: string
        ratio: number
        required: number
      }> = []

      // This is a simplified implementation
      // In practice, you'd use a proper color contrast calculation library
      Array.from(elements).forEach(el => {
        const styles = window.getComputedStyle(el)
        const color = styles.color
        const backgroundColor = styles.backgroundColor
        
        // Mock contrast ratio calculation
        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          const mockRatio = Math.random() * 10 + 1 // Mock ratio between 1-11
          const required = 4.5 // WCAG AA standard
          
          if (mockRatio < required) {
            violations.push({
              element: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
              foreground: color,
              background: backgroundColor,
              ratio: mockRatio,
              required
            })
          }
        }
      })

      return violations.slice(0, 5) // Limit to first 5 violations
    })

    return { violations }
  }

  async testMobileAccessibility(): Promise<{
    touchTargetSize: boolean
    viewportMeta: boolean
    orientationSupport: boolean
  }> {
    const result = await this.page.evaluate(() => {
      // Check touch target sizes (minimum 44px)
      const interactiveElements = document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [tabindex]'
      )
      
      const touchTargetSize = Array.from(interactiveElements).every(el => {
        const rect = el.getBoundingClientRect()
        return rect.width >= 44 && rect.height >= 44
      })

      // Check for viewport meta tag
      const viewportMeta = !!document.querySelector('meta[name="viewport"]')

      // Check orientation support (simplified)
      const orientationSupport = window.screen.orientation !== undefined

      return {
        touchTargetSize,
        viewportMeta,
        orientationSupport
      }
    })

    return result
  }

  async generateAccessibilityReport(results: AccessibilityTestResult): Promise<string> {
    const { violations, passes, incomplete } = results

    let report = '# Accessibility Test Report\n\n'
    
    report += `## Summary\n`
    report += `- Violations: ${violations.length}\n`
    report += `- Passes: ${passes.length}\n`
    report += `- Incomplete: ${incomplete.length}\n\n`

    if (violations.length > 0) {
      report += `## Violations\n\n`
      violations.forEach(violation => {
        report += `### ${violation.id} (${violation.impact})\n`
        report += `${violation.description}\n`
        report += `Help: ${violation.help}\n`
        report += `More info: ${violation.helpUrl}\n\n`
        
        violation.nodes.forEach(node => {
          report += `- Target: ${node.target.join(', ')}\n`
          report += `  HTML: \`${node.html.substring(0, 100)}...\`\n\n`
        })
      })
    }

    return report
  }
}

// WCAG compliance levels
export const WCAG_LEVELS = {
  A: 'A',
  AA: 'AA',
  AAA: 'AAA'
} as const

// Common accessibility test tags
export const ACCESSIBILITY_TAGS = {
  WCAG2A: 'wcag2a',
  WCAG2AA: 'wcag2aa',
  WCAG2AAA: 'wcag2aaa',
  WCAG21A: 'wcag21a',
  WCAG21AA: 'wcag21aa',
  WCAG21AAA: 'wcag21aaa',
  BEST_PRACTICE: 'best-practice'
} as const

// Helper function to assert accessibility compliance
export const assertAccessibility = (
  results: AccessibilityTestResult,
  level: keyof typeof WCAG_LEVELS = 'AA'
) => {
  const criticalViolations = results.violations.filter(
    v => v.impact === 'critical' || v.impact === 'serious'
  )

  if (criticalViolations.length > 0) {
    const violationSummary = criticalViolations
      .map(v => `${v.id}: ${v.description}`)
      .join('\n')
    
    throw new Error(
      `Accessibility violations found (WCAG ${level}):\n${violationSummary}`
    )
  }
}