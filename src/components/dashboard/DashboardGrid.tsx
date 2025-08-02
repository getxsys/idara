'use client'

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { DashboardWidget } from './DashboardWidget'
import { WidgetData, WidgetConfig } from '@/types/dashboard'

interface DashboardGridProps {
  widgets: WidgetData[]
  onWidgetReorder?: (widgets: WidgetData[]) => void
  onWidgetConfigChange?: (widgetId: string, config: WidgetConfig) => void
  className?: string
}

export function DashboardGrid({ 
  widgets: initialWidgets, 
  onWidgetReorder,
  onWidgetConfigChange,
  className = '' 
}: DashboardGridProps) {
  const [widgets, setWidgets] = useState(initialWidgets)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((widget) => widget.id === active.id)
      const newIndex = widgets.findIndex((widget) => widget.id === over.id)
      
      const newWidgets = arrayMove(widgets, oldIndex, newIndex)
      setWidgets(newWidgets)
      onWidgetReorder?.(newWidgets)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
          {widgets.map((widget) => (
            <DashboardWidget
              key={widget.id}
              widget={widget}
              onConfigChange={onWidgetConfigChange}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}