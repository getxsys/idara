'use client'

import React, { useState, useEffect } from 'react'
import { RealTimeDashboard } from '@/components/dashboard/RealTimeDashboard'
import { generateSampleWidgets, updateWidgetData } from '@/lib/mock-data'
import { WidgetData } from '@/types/dashboard'

export default function RealTimeDashboardPage() {
  const [widgets, setWidgets] = useState<WidgetData[]>([])

  // Initialize with sample widgets
  useEffect(() => {
    setWidgets(generateSampleWidgets())
  }, [])

  // Simulate real-time updates (since we don't have a real WebSocket server)
  useEffect(() => {
    const interval = setInterval(() => {
      setWidgets(prevWidgets => 
        prevWidgets.map(widget => 
          widget.realTimeEnabled ? updateWidgetData(widget) : widget
        )
      )
    }, 3000) // Update every 3 seconds

    return () => clearInterval(interval)
  }, [])

  const handleWidgetUpdate = (updatedWidgets: WidgetData[]) => {
    setWidgets(updatedWidgets)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Real-Time KPI Dashboard
        </h1>
        <p className="text-gray-600">
          Interactive dashboard with real-time KPI widgets, charts, and customizable configurations.
        </p>
      </div>

      <RealTimeDashboard
        initialWidgets={widgets}
        websocketUrl="ws://localhost:8080/dashboard" // This would be your actual WebSocket URL
        onWidgetUpdate={handleWidgetUpdate}
        className="space-y-6"
      />

      {/* Demo Information */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          Demo Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h3 className="font-medium mb-2">Real-Time KPI Widgets</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Live data updates every 3 seconds</li>
              <li>Status indicators (good, warning, critical)</li>
              <li>Trend analysis with percentage changes</li>
              <li>Target progress tracking</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Interactive Charts</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Multiple chart types (line, bar, doughnut, pie)</li>
              <li>Real-time data streaming</li>
              <li>Trend calculations and indicators</li>
              <li>Customizable colors and settings</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Dashboard Features</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Drag and drop widget reordering</li>
              <li>WebSocket connection status</li>
              <li>Manual refresh capability</li>
              <li>Responsive grid layout</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Widget Configuration</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Configurable refresh intervals</li>
              <li>Custom color schemes</li>
              <li>Alert thresholds</li>
              <li>Display options and comparisons</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}