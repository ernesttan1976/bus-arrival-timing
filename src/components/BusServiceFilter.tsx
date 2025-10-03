import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BusServiceFilterProps {
  onFilterChange: (filters: string[]) => void;
  activeFilters: string[];
}

const BusServiceFilter = ({ onFilterChange, activeFilters }: BusServiceFilterProps) => {
  const [filterInput, setFilterInput] = useState('');

  const addFilter = () => {
    if (filterInput.trim() && !activeFilters.includes(filterInput.trim().toUpperCase())) {
      const newFilters = [...activeFilters, filterInput.trim().toUpperCase()];
      onFilterChange(newFilters);
      setFilterInput('');
    }
  };

  const removeFilter = (filter: string) => {
    const newFilters = activeFilters.filter(f => f !== filter);
    onFilterChange(newFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addFilter();
    }
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Filter by bus number (e.g., 14, 111)..."
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={addFilter} size="sm" variant="outline">
          Add Filter
        </Button>
      </div>
      
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="flex items-center gap-1">
              Bus {filter}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeFilter(filter)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusServiceFilter;