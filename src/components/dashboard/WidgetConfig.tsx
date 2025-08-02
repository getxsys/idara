'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Settings, Palette, Clock, Target } from 'lucide-react'
import { WidgetConfig, WidgetData } from '@/types/dashboard'

interface WidgetConfigProps {
  widget: WidgetData
  onConfigChange: (widgetId: string, config: WidgetConfig) => void
  trigger?: React.ReactNode
}

export function WidgetConfigDialog({ widget, onConfigChange, trigger }: WidgetConfigProps) {
  const [config, setConfig] = useState<WidgetConfig>(widget.config || {})
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    onConfigChange(widget.id, config)
    setIsOpen(false)
  }

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const updateColors = (colorKey: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, [colorKey]: value }
    }))
  }

  const updateThresholds = (thresholdKey: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      thresholds: { ...prev.thresholds, [thresholdKey]: value }
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Settings className="h-3 w-3" />
            <span className="sr-only">Configure widget</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {widget.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Chart Type Selection */}
          {(widget.type === 'chart' || widget.type === 'kpi') && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Chart Type
              </Label>
              <Select
                value={config.chartType || 'line'}
                onValueChange={(value) => updateConfig('chartType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="doughnut">Doughnut Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Source */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data Source</Label>
            <Input
              placeholder="Enter data source endpoint"
              value={config.dataSource || ''}
              onChange={(e) => updateConfig('dataSource', e.target.value)}
            />
          </div>

          {/* Refresh Interval */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Refresh Interval (seconds)
            </Label>
            <Input
              type="number"
              min="1"
              max="3600"
              placeholder="30"
              value={config.refreshInterval || ''}
              onChange={(e) => updateConfig('refreshInterval', parseInt(e.target.value) || 30)}
            />
          </div>

          <Separator />

          {/* Display Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Display Options</Label>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-trend" className="text-sm">Show Trend</Label>
              <Switch
                id="show-trend"
                checked={config.showTrend ?? true}
                onCheckedChange={(checked) => updateConfig('showTrend', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-comparison" className="text-sm">Show Comparison</Label>
              <Switch
                id="show-comparison"
                checked={config.showComparison ?? false}
                onCheckedChange={(checked) => updateConfig('showComparison', checked)}
              />
            </div>

            {config.showComparison && (
              <div className="space-y-2">
                <Label className="text-sm">Comparison Period</Label>
                <Select
                  value={config.comparisonPeriod || 'day'}
                  onValueChange={(value) => updateConfig('comparisonPeriod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Thresholds */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Alert Thresholds
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Warning</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={config.thresholds?.warning || ''}
                  onChange={(e) => updateThresholds('warning', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Critical</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={config.thresholds?.critical || ''}
                  onChange={(e) => updateThresholds('critical', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Colors */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Primary</Label>
                <Input
                  type="color"
                  value={config.colors?.primary || '#3b82f6'}
                  onChange={(e) => updateColors('primary', e.target.value)}
                  className="h-8 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Secondary</Label>
                <Input
                  type="color"
                  value={config.colors?.secondary || '#10b981'}
                  onChange={(e) => updateColors('secondary', e.target.value)}
                  className="h-8 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Warning</Label>
                <Input
                  type="color"
                  value={config.colors?.warning || '#f59e0b'}
                  onChange={(e) => updateColors('warning', e.target.value)}
                  className="h-8 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Critical</Label>
                <Input
                  type="color"
                  value={config.colors?.critical || '#ef4444'}
                  onChange={(e) => updateColors('critical', e.target.value)}
                  className="h-8 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}