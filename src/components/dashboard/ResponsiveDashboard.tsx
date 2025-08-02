'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardGrid } from './DashboardGrid'
import { WidgetData } from '@/types/dashboard'
import { Settings, Plus } from 'lucide-react'

// Sample widget data
const defaultWidgets: WidgetData[] = [
  {
    id: '1',
    title: 'Total Revenue',
    type: 'metric',
    size: 'small',
    value: '$124,500',
    description: 'This month',
    change: 12.5,
  },
  {
    id: '2',
    title: 'Active Projects',
    type: 'metric',
    size: 'small',
    value: '23',
    description: 'Currently running',
    change: -2.1,
  },
  {
    id: '3',
    title: 'Client Satisfaction',
    type: 'metric',
    size: 'small',
    value: '94%',
    description: 'Average rating',
    change: 3.2,
  },
  {
    id: '4',
    title: 'Revenue Trend',
    type: 'chart',
    size: 'medium',
    description: 'Last 6 months performance',
  },
  {
    id: '5',
    title: 'Recent Activities',
    type: 'list',
    size: 'medium',
    items: [
      'Project Alpha completed',
      'New client onboarded',
      'Team meeting scheduled',
      'Invoice #1234 sent',
    ],
  },
  {
    id: '6',
    title: 'Quick Stats',
    type: 'chart',
    size: 'small',
    description: 'Key metrics overview',
  },
]

interface ResponsiveDashboardProps {
  title?: string
  subtitle?: string
}

export function ResponsiveDashboard({ 
  title = 'Business Dashboard',
  subtitle = 'Welcome back! Here\'s what\'s happening with your business today.'
}: ResponsiveDashboardProps) {
  const [widgets, setWidgets] = useState<WidgetData[]>(defaultWidgets)
  const [isCustomizing, setIsCustomizing] = useState(false)

  const handleWidgetReorder = (newWidgets: WidgetData[]) => {
    setWidgets(newWidgets)
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>

      {/* Customization Notice */}
      {isCustomizing && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Drag and drop widgets to customize your dashboard layout
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      <DashboardGrid
        widgets={widgets}
        onWidgetReorder={handleWidgetReorder}
        className={isCustomizing ? 'ring-2 ring-primary/20 rounded-lg p-4' : ''}
      />

      {/* Mobile-specific quick actions */}
      <div className="block sm:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" className="h-auto py-3">
                <div className="text-center">
                  <Plus className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-xs">New Project</div>
                </div>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3">
                <div className="text-center">
                  <Settings className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-xs">Settings</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}