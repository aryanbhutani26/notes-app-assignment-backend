import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { useDebounce } from '../../hooks/usePerformance';
import './DebouncedSearch.css';

const DebouncedSearch = ({
  onSearch,
  onClear,
  placeholder = 'Search...',
  delay = 300,
  minLength = 1,
  showClearButton = true,
  showSearchIcon = true,
  showLoadingIndicator = true,
  className = '',
  autoFocus = false,
  disabled = false,
  value: controlledValue,
  onChange: controlledOnChange,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Use controlled or uncontrolled value
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledOnChange || setInternalValue;

  // Debounce the search value
  const debouncedValue = useDebounce(value, delay);

  // Handle search execution
  useEffect(() => {
    if (debouncedValue.length >= minLength) {
      setIsLoading(true);
      
      const executeSearch = async () => {
        try {
          await onSearch?.(debouncedValue);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      };

      executeSearch();
    } else if (debouncedValue.length === 0) {
      onClear?.();
      setIsLoading(false);
    }
  }, [debouncedValue, minLength, onSearch, onClear]);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Show loading immediately for better UX
    if (newValue.length >= minLength) {
      setIsLoading(true);
    }
  }, [setValue, minLength]);

  // Handle clear
  const handleClear = useCallback(() => {
    setValue('');
    onClear?.();
    setIsLoading(false);
    inputRef.current?.focus();
  }, [setValue, onClear]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setHasFocus(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback(() => {
    setHasFocus(false);
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (value) {
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    }
  }, [value, handleClear]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Expose focus method
  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Expose clear method
  const clear = useCallback(() => {
    handleClear();
  }, [handleClear]);

  return (
    <div className={`debounced-search ${className} ${hasFocus ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}>
      <div className="search-input-container">
        {showSearchIcon && (
          <div className="search-icon">
            <Search size={16} />
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="search-input"
          aria-label="Search"
          {...props}
        />

        <div className="search-actions">
          {showLoadingIndicator && isLoading && (
            <div className="search-loading" aria-label="Searching">
              <Loader size={16} className="spinning" />
            </div>
          )}
          
          {showClearButton && value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="search-clear"
              aria-label="Clear search"
              tabIndex={-1}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search suggestions or results count could go here */}
      <div className="search-meta">
        {value && value.length < minLength && (
          <span className="search-hint">
            Type at least {minLength} character{minLength > 1 ? 's' : ''} to search
          </span>
        )}
      </div>
    </div>
  );
};

// Hook for managing search state
export const useSearchState = (initialValue = '', options = {}) => {
  const {
    delay = 300,
    minLength = 1,
    onSearch,
    onClear
  } = options;

  const [searchValue, setSearchValue] = useState(initialValue);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const debouncedSearchValue = useDebounce(searchValue, delay);

  // Execute search
  useEffect(() => {
    if (debouncedSearchValue.length >= minLength) {
      const executeSearch = async () => {
        setIsSearching(true);
        setSearchError(null);

        try {
          const results = await onSearch?.(debouncedSearchValue);
          setSearchResults(results || []);
        } catch (error) {
          setSearchError(error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      };

      executeSearch();
    } else if (debouncedSearchValue.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      onClear?.();
    }
  }, [debouncedSearchValue, minLength, onSearch, onClear]);

  const clearSearch = useCallback(() => {
    setSearchValue('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchError(null);
  }, []);

  return {
    searchValue,
    setSearchValue,
    searchResults,
    isSearching,
    searchError,
    clearSearch,
    hasResults: searchResults.length > 0,
    hasQuery: searchValue.length >= minLength
  };
};

// Advanced search with filters
export const AdvancedSearch = ({
  onSearch,
  filters = [],
  sortOptions = [],
  className = '',
  ...searchProps
}) => {
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSearch = useCallback(async (query) => {
    const searchParams = {
      query,
      filters: activeFilters,
      sortBy,
      sortOrder
    };

    return await onSearch?.(searchParams);
  }, [onSearch, activeFilters, sortBy, sortOrder]);

  const handleFilterChange = useCallback((filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    setSortBy('');
    setSortOrder('asc');
  }, []);

  return (
    <div className={`advanced-search ${className}`}>
      <DebouncedSearch
        {...searchProps}
        onSearch={handleSearch}
        className="advanced-search-input"
      />

      {(filters.length > 0 || sortOptions.length > 0) && (
        <div className="search-controls">
          {filters.length > 0 && (
            <div className="search-filters">
              {filters.map(filter => (
                <div key={filter.key} className="search-filter">
                  <label htmlFor={`filter-${filter.key}`}>
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      id={`filter-${filter.key}`}
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    >
                      <option value="">All</option>
                      {filter.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`filter-${filter.key}`}
                      type={filter.type || 'text'}
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      placeholder={filter.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {sortOptions.length > 0 && (
            <div className="search-sort">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Sort by...</option>
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="sort-order-toggle"
                aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={clearAllFilters}
            className="clear-filters"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default DebouncedSearch;