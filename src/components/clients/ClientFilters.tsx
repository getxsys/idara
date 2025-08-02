'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClientFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export function ClientFilters({ onFiltersChange }: ClientFiltersProps) {
  const [filters, setFilters] = useState({
    industry: '',
    revenueMin: '',
    revenueMax: '',
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { industry: '', revenueMin: '', revenueMax: '' };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select value={filters.industry} onValueChange={(value) => handleFilterChange('industry', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Industries</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="revenueMin">Min Revenue</Label>
          <Input
            id="revenueMin"
            type="number"
            placeholder="0"
            value={filters.revenueMin}
            onChange={(e) => handleFilterChange('revenueMin', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="revenueMax">Max Revenue</Label>
          <Input
            id="revenueMax"
            type="number"
            placeholder="1000000"
            value={filters.revenueMax}
            onChange={(e) => handleFilterChange('revenueMax', e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}