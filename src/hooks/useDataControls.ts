import { useState, useMemo } from 'react';

interface UseDataControlsOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  initialSort?: string;
  initialFilters?: string[];
}

export function useDataControls<T>({
  data,
  searchFields,
  initialSort = '',
  initialFilters = [],
}: UseDataControlsOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(initialSort);
  const [activeFilters, setActiveFilters] = useState<string[]>(initialFilters);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    if (activeFilters.length > 0) {
      result = result.filter((item) => {
        // Customize this based on your filter logic
        return activeFilters.every((filter) => {
          switch (filter) {
            case 'upcoming':
              return (item as any).status === 'upcoming';
            case 'active':
              return (item as any).status === 'active';
            case 'completed':
              return (item as any).status === 'completed';
            case 'admin':
              return (item as any).role === 'admin';
            case 'photographer':
              return (item as any).role === 'photographer';
            case 'attendee':
              return (item as any).role === 'attendee';
            case 'company':
              return (item as any).host_type === 'company';
            case 'individual':
              return (item as any).host_type === 'individual';
            default:
              return true;
          }
        });
      });
    }

    // Apply sort
    if (sortBy) {
      result.sort((a, b) => {
        switch (sortBy) {
          case 'name_asc':
            return (a as any).name.localeCompare((b as any).name);
          case 'name_desc':
            return (b as any).name.localeCompare((a as any).name);
          case 'date_asc':
            return new Date(a.date as any).getTime() - new Date(b.date as any).getTime();
          case 'date_desc':
            return new Date(b.date as any).getTime() - new Date(a.date as any).getTime();
          case 'email_asc':
            return (a as any).email.localeCompare((b as any).email);
          case 'email_desc':
            return (b as any).email.localeCompare((a as any).email);
          case 'role_asc':
            return (a as any).role.localeCompare((b as any).role);
          case 'role_desc':
            return (b as any).role.localeCompare((a as any).role);
          case 'created_asc':
            return new Date(a.created_at as any).getTime() - new Date(b.created_at as any).getTime();
          case 'created_desc':
            return new Date(b.created_at as any).getTime() - new Date(a.created_at as any).getTime();
          default:
            return 0;
        }
      });
    }

    return result;
  }, [data, searchQuery, sortBy, activeFilters]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    activeFilters,
    setActiveFilters,
    filteredData,
  };
}