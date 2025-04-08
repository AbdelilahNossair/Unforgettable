import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface SortOption {
  label: string;
  value: string;
}

interface FilterOption {
  label: string;
  value: string;
}

interface DataControlsProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortOptions: SortOption[];
  selectedSort: string;
  onSortChange: (value: string) => void;
  filterOptions: FilterOption[];
  selectedFilters: string[];
  onFilterChange: (values: string[]) => void;
}

export const DataControls: React.FC<DataControlsProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  sortOptions,
  selectedSort,
  onSortChange,
  filterOptions,
  selectedFilters,
  onFilterChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="h-5 w-5 text-gray-400" />
          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
            isFilterOpen || selectedFilters.length > 0
              ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent'
              : 'dark:bg-gray-800 dark:border-gray-700'
          }`}
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          Filters
          {selectedFilters.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-full text-xs">
              {selectedFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Options */}
      {isFilterOpen && (
        <div className="p-4 border rounded-lg dark:border-gray-700 space-y-4">
          <h3 className="font-medium mb-2">Filters</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFilters.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onFilterChange([...selectedFilters, option.value]);
                    } else {
                      onFilterChange(selectedFilters.filter((f) => f !== option.value));
                    }
                  }}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};