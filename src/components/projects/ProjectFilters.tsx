'use client';

import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ProjectStatus, RiskLevel } from '@/types/project';
import { cn } from '@/lib/utils';

interface ProjectFiltersProps {
  onFiltersChange?: (filters: ProjectFilters) => void;
}

export interface ProjectFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  healthScoreRange?: [number, number];
  riskLevel?: RiskLevel[];
  teamSizeRange?: [number, number];
  tags?: string[];
  clientId?: string;
}

export function ProjectFilters({ onFiltersChange }: ProjectFiltersProps) {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [healthScore, setHealthScore] = useState<[number, number]>([0, 100]);
  const [teamSize, setTeamSize] = useState<[number, number]>([1, 20]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<RiskLevel[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const updateFilters = (newFilters: Partial<ProjectFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange?.(updated);
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    if (range.from && range.to) {
      updateFilters({ dateRange: { from: range.from, to: range.to } });
    } else {
      const { dateRange: _, ...rest } = filters;
      updateFilters(rest);
    }
  };

  const handleHealthScoreChange = (value: [number, number]) => {
    setHealthScore(value);
    updateFilters({ healthScoreRange: value });
  };

  const handleTeamSizeChange = (value: [number, number]) => {
    setTeamSize(value);
    updateFilters({ teamSizeRange: value });
  };

  const toggleRiskLevel = (level: RiskLevel) => {
    const updated = selectedRiskLevels.includes(level)
      ? selectedRiskLevels.filter(l => l !== level)
      : [...selectedRiskLevels, level];
    setSelectedRiskLevels(updated);
    updateFilters({ riskLevel: updated.length > 0 ? updated : undefined });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const updated = [...tags, tagInput.trim()];
      setTags(updated);
      setTagInput('');
      updateFilters({ tags: updated });
    }
  };

  const removeTag = (tag: string) => {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    updateFilters({ tags: updated.length > 0 ? updated : undefined });
  };

  const clearAllFilters = () => {
    setFilters({});
    setDateRange({});
    setHealthScore([0, 100]);
    setTeamSize([1, 20]);
    setSelectedRiskLevels([]);
    setTags([]);
    setTagInput('');
    onFiltersChange?.({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Advanced Filters</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Project Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} -{' '}
                      {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Health Score Range */}
        <div className="space-y-3">
          <Label>Health Score Range</Label>
          <div className="px-3">
            <Slider
              value={healthScore}
              onValueChange={handleHealthScoreChange}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{healthScore[0]}</span>
              <span>{healthScore[1]}</span>
            </div>
          </div>
        </div>

        {/* Team Size Range */}
        <div className="space-y-3">
          <Label>Team Size Range</Label>
          <div className="px-3">
            <Slider
              value={teamSize}
              onValueChange={handleTeamSizeChange}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{teamSize[0]} member{teamSize[0] > 1 ? 's' : ''}</span>
              <span>{teamSize[1]} member{teamSize[1] > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Risk Levels */}
        <div className="space-y-2">
          <Label>Risk Levels</Label>
          <div className="flex flex-wrap gap-2">
            {Object.values(RiskLevel).map((level) => (
              <Button
                key={level}
                variant={selectedRiskLevels.includes(level) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleRiskLevel(level)}
                className="text-xs"
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              className="flex-1"
            />
            <Button type="button" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Client Filter */}
        <div className="space-y-2">
          <Label>Client</Label>
          <Select onValueChange={(value) => updateFilters({ clientId: value || undefined })}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Clients</SelectItem>
              {/* TODO: Load actual clients */}
              <SelectItem value="client-1">Acme Corp</SelectItem>
              <SelectItem value="client-2">TechStart Inc</SelectItem>
              <SelectItem value="client-3">Global Solutions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Active filters:</span>
            <div className="flex flex-wrap gap-1">
              {filters.dateRange && (
                <Badge variant="outline" className="text-xs">
                  Date: {format(filters.dateRange.from, 'MMM dd')} - {format(filters.dateRange.to, 'MMM dd')}
                </Badge>
              )}
              {filters.healthScoreRange && (
                <Badge variant="outline" className="text-xs">
                  Health: {filters.healthScoreRange[0]}-{filters.healthScoreRange[1]}
                </Badge>
              )}
              {filters.teamSizeRange && (
                <Badge variant="outline" className="text-xs">
                  Team: {filters.teamSizeRange[0]}-{filters.teamSizeRange[1]}
                </Badge>
              )}
              {filters.riskLevel && filters.riskLevel.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Risk: {filters.riskLevel.join(', ')}
                </Badge>
              )}
              {filters.tags && filters.tags.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Tags: {filters.tags.join(', ')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}