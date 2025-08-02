'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { KPIData, WidgetConfig } from '@/types/dashboard'
import { cn } from '@/lib/utils'

interface KPIWidgetProps {
  title: string
  data: KPIData
  config?: WidgetConfig
  className?: string
  showLastUpdated?: boolean
}

export function KPIWidget({ 
  title, 
  data, 
  config, 
  className,
  showLastUpdated = true 
}: KPIWidgetProps) {
  const {
    value,
    previousValue,
    target,
    unit = '',
    trend,
    change,
    changePercent,
    status,
    timestamp
  } = data

  const statusColors = useMemo(() => {
    switch (status) {
      case 'good':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-800'
        }
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800'
        }
    }
  }, [status])

  const trendIcon = useMemo(() => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }, [trend])

  const formatValue = (val: number): string => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`
    }
    return val.toLocaleString()
  }

  const formatChange = (changeVal: number): string => {
    const sign = changeVal >= 0 ? '+' : ''
    return `${sign}${formatValue(changeVal)}`
  }

  const formatPercentage = (percent: number): string => {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(1)}%`
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      statusColors.bg,
      statusColors.border,
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-900">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {trendIcon}
          <Badge variant="secondary" className={statusColors.badge}>
            {status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main Value */}
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {formatValue(value)}{unit}
          </div>
          
          {/* Change Indicators */}
          <div className="flex items-center gap-3 text-sm">
            <div className={cn(
              'flex items-center gap-1',
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-600'
            )}>
              <span>{formatChange(change)}{unit}</span>
              <span>({formatPercentage(changePercent)})</span>
            </div>
          </div>
        </div>

        {/* Target Progress */}
        {target && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress to target</span>
              <span>{formatValue(target)}{unit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  status === 'good' ? 'bg-green-500' :
                  status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{
                  width: `${Math.min((value / target) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Previous Value Comparison */}
        {previousValue && config?.showComparison && (
          <div className="text-xs text-gray-600">
            Previous {config.comparisonPeriod || 'period'}: {formatValue(previousValue)}{unit}
          </div>
        )}

        {/* Last Updated */}
        {showLastUpdated && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Updated {timestamp.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}