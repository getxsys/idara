'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, MoreHorizontal } from 'lucide-react'
import { WidgetData, WidgetConfig } from '@/types/dashboard'
import { KPIWidget } from './KPIWidget'
import { ChartWidget } from './ChartWidget'
import { WidgetConfigDialog } from './WidgetConfig'

interface DashboardWidgetProps {
  widget: WidgetData
  onConfigChange?: (widgetId: string, config: WidgetConfig) => void
}

export function DashboardWidget({ widget, onConfigChange }: DashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getWidgetSize = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1'
      case 'medium':
        return 'col-span-1 sm:col-span-2 row-span-1'
      case 'large':
        return 'col-span-1 sm:col-span-2 lg:col-span-3 row-span-2'
      case 'wide':
        return 'col-span-1 sm:col-span-2 lg:col-span-4 row-span-1'
      default:
        return 'col-span-1 row-span-1'
    }
  }

  // Render specialized widget types
  if (widget.type === 'kpi' && widget.data) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${getWidgetSize(widget.size)} ${isDragging ? 'z-50' : ''}`}
      >
        <div className="relative h-full">
          <KPIWidget
            title={widget.title}
            data={widget.data}
            config={widget.config}
            className="h-full"
            showLastUpdated={widget.realTimeEnabled}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3 w-3" />
              <span className="sr-only">Drag to reorder</span>
            </Button>
            {onConfigChange && (
              <WidgetConfigDialog
                widget={widget}
                onConfigChange={onConfigChange}
                trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                    <span className="sr-only">Widget options</span>
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (widget.type === 'chart' && widget.data) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${getWidgetSize(widget.size)} ${isDragging ? 'z-50' : ''}`}
      >
        <div className="relative h-full">
          <ChartWidget
            title={widget.title}
            data={widget.data}
            config={widget.config}
            className="h-full"
            showLastUpdated={widget.realTimeEnabled}
            lastUpdated={widget.lastUpdated}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3 w-3" />
              <span className="sr-only">Drag to reorder</span>
            </Button>
            {onConfigChange && (
              <WidgetConfigDialog
                widget={widget}
                onConfigChange={onConfigChange}
                trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                    <span className="sr-only">Widget options</span>
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Fallback to original widget rendering for backward compatibility
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getWidgetSize(widget.size)} ${isDragging ? 'z-50' : ''}`}
    >
      <Card className="h-full transition-shadow hover:shadow-md group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3 w-3" />
              <span className="sr-only">Drag to reorder</span>
            </Button>
            {onConfigChange ? (
              <WidgetConfigDialog
                widget={widget}
                onConfigChange={onConfigChange}
                trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                    <span className="sr-only">Widget options</span>
                  </Button>
                }
              />
            ) : (
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
                <span className="sr-only">Widget options</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {widget.type === 'metric' && (
              <div>
                <div className="text-2xl font-bold">{widget.value}</div>
                <p className="text-xs text-muted-foreground">{widget.description}</p>
                {widget.change && (
                  <div className={`text-xs ${widget.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {widget.change > 0 ? '+' : ''}{widget.change}%
                  </div>
                )}
              </div>
            )}
            {widget.type === 'chart' && !widget.data && (
              <div className="h-24 bg-muted rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Chart placeholder</span>
              </div>
            )}
            {widget.type === 'list' && (
              <div className="space-y-1">
                {widget.items?.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}