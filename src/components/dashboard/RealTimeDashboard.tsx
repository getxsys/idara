'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { DashboardGrid } from './DashboardGrid'
import { useWebSocket } from '@/hooks/use-websocket'
import { WidgetData, WidgetConfig, RealTimeUpdate, KPIData, ChartDataPoint } from '@/types/dashboard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, WifiOff, RefreshCw, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealTimeDashboardProps {
  initialWidgets: WidgetData[]
  websocketUrl?: string
  onWidgetUpdate?: (widgets: WidgetData[]) => void
  className?: string
}

export function RealTimeDashboard({
  initialWidgets,
  websocketUrl = 'ws://localhost:8080/dashboard',
  onWidgetUpdate,
  className
}: RealTimeDashboardProps) {
  const [widgets, setWidgets] = useState<WidgetData[]>(initialWidgets)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())
  const [updateCount, setUpdateCount] = useState(0)

  // WebSocket connection for real-time updates
  const {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    reconnect
  } = useWebSocket({
    url: websocketUrl,
    onMessage: handleRealTimeUpdate,
    onConnect: () => {
      console.log('Dashboard WebSocket connected')
      // Subscribe to widget updates
      sendMessage({
        type: 'subscribe',
        widgets: widgets.filter(w => w.realTimeEnabled).map(w => w.id)
      })
    },
    onDisconnect: () => {
      console.log('Dashboard WebSocket disconnected')
    },
    onError: (error) => {
      console.error('Dashboard WebSocket error:', error)
    }
  })

  // Handle real-time updates from WebSocket
  function handleRealTimeUpdate(update: RealTimeUpdate) {
    setWidgets(prevWidgets => {
      return prevWidgets.map(widget => {
        if (widget.id === update.widgetId) {
          return {
            ...widget,
            data: update.data,
            lastUpdated: update.timestamp
          }
        }
        return widget
      })
    })
    
    setLastUpdateTime(update.timestamp)
    setUpdateCount(prev => prev + 1)
  }

  // Handle widget reordering
  const handleWidgetReorder = useCallback((reorderedWidgets: WidgetData[]) => {
    setWidgets(reorderedWidgets)
    onWidgetUpdate?.(reorderedWidgets)
  }, [onWidgetUpdate])

  // Handle widget configuration changes
  const handleWidgetConfigChange = useCallback((widgetId: string, config: WidgetConfig) => {
    setWidgets(prevWidgets => {
      const updatedWidgets = prevWidgets.map(widget => {
        if (widget.id === widgetId) {
          const updatedWidget = { ...widget, config }
          
          // If real-time is enabled/disabled, update subscription
          if (config.refreshInterval && widget.realTimeEnabled !== (config.refreshInterval > 0)) {
            const newRealTimeEnabled = config.refreshInterval > 0
            if (newRealTimeEnabled && isConnected) {
              sendMessage({
                type: 'subscribe',
                widgets: [widgetId]
              })
            } else if (!newRealTimeEnabled && isConnected) {
              sendMessage({
                type: 'unsubscribe',
                widgets: [widgetId]
              })
            }
            updatedWidget.realTimeEnabled = newRealTimeEnabled
          }
          
          return updatedWidget
        }
        return widget
      })
      
      onWidgetUpdate?.(updatedWidgets)
      return updatedWidgets
    })
  }, [isConnected, sendMessage, onWidgetUpdate])

  // Manual refresh for all widgets
  const handleManualRefresh = useCallback(() => {
    if (isConnected) {
      sendMessage({
        type: 'refresh',
        widgets: widgets.filter(w => w.realTimeEnabled).map(w => w.id)
      })
    }
  }, [isConnected, sendMessage, widgets])

  // Update WebSocket subscriptions when widgets change
  useEffect(() => {
    if (isConnected) {
      const realTimeWidgets = widgets.filter(w => w.realTimeEnabled).map(w => w.id)
      if (realTimeWidgets.length > 0) {
        sendMessage({
          type: 'subscribe',
          widgets: realTimeWidgets
        })
      }
    }
  }, [isConnected, widgets, sendMessage])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Real-Time Dashboard</CardTitle>
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isConnecting ? (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Connecting
                  </Badge>
                ) : isConnected ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Wifi className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
              </div>

              {/* Manual Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={!isConnected}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>

              {/* Reconnect Button */}
              {!isConnected && !isConnecting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="h-8"
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  Reconnect
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                {widgets.filter(w => w.realTimeEnabled).length} real-time widgets
              </span>
              <span>
                {updateCount} updates received
              </span>
            </div>
            <div>
              Last update: {lastUpdateTime.toLocaleTimeString()}
            </div>
          </div>
          
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Connection error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <DashboardGrid
        widgets={widgets}
        onWidgetReorder={handleWidgetReorder}
        onWidgetConfigChange={handleWidgetConfigChange}
        className="min-h-[400px]"
      />
    </div>
  )
}