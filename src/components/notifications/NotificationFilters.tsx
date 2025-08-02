'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { X, Filter, RotateCcw } from 'lucide-react';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '@/types/notification';

interface NotificationFiltersProps {
  onFiltersChange: (filters: NotificationFilters) => void;
  onClose: () => void;
  className?: string;
}

interface NotificationFilters {
  categories: NotificationCategory[];
  priorities: NotificationPriority[];
  types: NotificationType[];
  relevanceThreshold: number;
  dateRange: {
    start?: Date;
    end?: Date;
  };
  showRead: boolean;
  showUnread: boolean;
  showArchived: boolean;
}

const defaultFilters: NotificationFilters = {
  categories: Object.values(NotificationCategory),
  priorities: Object.values(NotificationPriority),
  types: Object.values(NotificationType),
  relevanceThreshold: 0,
  dateRange: {},
  showRead: true,
  showUnread: true,
  showArchived: false,
};

export function NotificationFilters({
  onFiltersChange,
  onClose,
  className = '',
}: NotificationFiltersProps) {
  const [filters, setFilters] = useState<NotificationFilters>(defaultFilters);

  const handleCategoryChange = (category: NotificationCategory, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    
    const newFilters = { ...filters, categories: newCategories };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriorityChange = (priority: NotificationPriority, checked: boolean) => {
    const newPriorities = checked
      ? [...filters.priorities, priority]
      : filters.priorities.filter(p => p !== priority);
    
    const newFilters = { ...filters, priorities: newPriorities };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTypeChange = (type: NotificationType, checked: boolean) => {
    const newTypes = checked
      ? [...filters.types, type]
      : filters.types.filter(t => t !== type);
    
    const newFilters = { ...filters, types: newTypes };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRelevanceThresholdChange = (value: number[]) => {
    const newFilters = { ...filters, relevanceThreshold: value[0] };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReadStatusChange = (field: 'showRead' | 'showUnread' | 'showArchived', checked: boolean) => {
    const newFilters = { ...filters, [field]: checked };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.WORK:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case NotificationCategory.PERSONAL:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case NotificationCategory.SYSTEM:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case NotificationCategory.SOCIAL:
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case NotificationCategory.UPDATES:
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case NotificationCategory.ALERTS:
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case NotificationCategory.REMINDERS:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case NotificationCategory.ACHIEVEMENTS:
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case NotificationCategory.MARKETING:
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case NotificationPriority.URGENT:
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case NotificationPriority.HIGH:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case NotificationPriority.NORMAL:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case NotificationPriority.LOW:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Notification Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Read Status */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Read Status</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-read"
                checked={filters.showRead}
                onCheckedChange={(checked) => handleReadStatusChange('showRead', checked as boolean)}
              />
              <Label htmlFor="show-read" className="text-sm">Show read notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-unread"
                checked={filters.showUnread}
                onCheckedChange={(checked) => handleReadStatusChange('showUnread', checked as boolean)}
              />
              <Label htmlFor="show-unread" className="text-sm">Show unread notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-archived"
                checked={filters.showArchived}
                onCheckedChange={(checked) => handleReadStatusChange('showArchived', checked as boolean)}
              />
              <Label htmlFor="show-archived" className="text-sm">Show archived notifications</Label>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Categories</Label>
          <div className="flex flex-wrap gap-2">
            {Object.values(NotificationCategory).map((category) => (
              <Badge
                key={category}
                variant={filters.categories.includes(category) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  filters.categories.includes(category) 
                    ? getCategoryColor(category)
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleCategoryChange(category, !filters.categories.includes(category))}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Priorities */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Priorities</Label>
          <div className="flex flex-wrap gap-2">
            {Object.values(NotificationPriority).map((priority) => (
              <Badge
                key={priority}
                variant={filters.priorities.includes(priority) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  filters.priorities.includes(priority) 
                    ? getPriorityColor(priority)
                    : 'hover:bg-muted'
                }`}
                onClick={() => handlePriorityChange(priority, !filters.priorities.includes(priority))}
              >
                {priority}
              </Badge>
            ))}
          </div>
        </div>

        {/* Types */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Types</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(NotificationType).map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.types.includes(type)}
                  onCheckedChange={(checked) => handleTypeChange(type, checked as boolean)}
                />
                <Label htmlFor={`type-${type}`} className="text-sm capitalize">
                  {type.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Relevance Threshold */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Minimum Relevance Score: {Math.round(filters.relevanceThreshold * 100)}%
          </Label>
          <Slider
            value={[filters.relevanceThreshold]}
            onValueChange={handleRelevanceThresholdChange}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
              <input
                id="start-date"
                type="date"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => {
                  const newFilters = {
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      start: e.target.value ? new Date(e.target.value) : undefined,
                    },
                  };
                  setFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
              <input
                id="end-date"
                type="date"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => {
                  const newFilters = {
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      end: e.target.value ? new Date(e.target.value) : undefined,
                    },
                  };
                  setFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}