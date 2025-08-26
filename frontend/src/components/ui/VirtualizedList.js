import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './VirtualizedList.css';

const VirtualizedList = ({
  items = [],
  itemHeight = 200,
  containerHeight = 600,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      key: item.id || startIndex + index
    }));
  }, [items, visibleRange]);

  // Handle scroll
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(e);
  }, [onScroll]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      {...props}
    >
      <div
        className="virtualized-list-inner"
        style={{ height: totalHeight, position: 'relative' }}
      >
        <div
          className="virtualized-list-content"
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index, key }) => (
            <div
              key={key}
              className="virtualized-list-item"
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Hook for dynamic item heights (more complex virtualization)
export const useDynamicVirtualization = ({
  items = [],
  estimatedItemHeight = 200,
  containerHeight = 600,
  overscan = 5
}) => {
  const [itemHeights, setItemHeights] = useState(new Map());
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate positions based on actual heights
  const itemPositions = useMemo(() => {
    const positions = [];
    let totalHeight = 0;

    items.forEach((item, index) => {
      const height = itemHeights.get(item.id) || estimatedItemHeight;
      positions[index] = {
        top: totalHeight,
        height,
        bottom: totalHeight + height
      };
      totalHeight += height;
    });

    return { positions, totalHeight };
  }, [items, itemHeights, estimatedItemHeight]);

  // Find visible range based on actual positions
  const visibleRange = useMemo(() => {
    const { positions } = itemPositions;
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;

    let startIndex = 0;
    let endIndex = items.length - 1;

    // Binary search for start index
    for (let i = 0; i < positions.length; i++) {
      if (positions[i].bottom > viewportTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // Binary search for end index
    for (let i = startIndex; i < positions.length; i++) {
      if (positions[i].top > viewportBottom) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [itemPositions, scrollTop, containerHeight, items.length, overscan]);

  // Update item height
  const updateItemHeight = useCallback((itemId, height) => {
    setItemHeights(prev => {
      const newHeights = new Map(prev);
      newHeights.set(itemId, height);
      return newHeights;
    });
  }, []);

  return {
    visibleRange,
    itemPositions,
    scrollTop,
    setScrollTop,
    updateItemHeight
  };
};

// Grid virtualization for note cards
export const VirtualizedGrid = ({
  items = [],
  itemWidth = 320,
  itemHeight = 200,
  containerWidth = 1200,
  containerHeight = 600,
  gap = 24,
  renderItem,
  overscan = 5,
  className = '',
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate grid dimensions
  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowsCount = Math.ceil(items.length / columnsCount);
  const totalHeight = rowsCount * (itemHeight + gap) - gap;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRow = Math.min(
      rowsCount - 1,
      Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
    );

    const startIndex = startRow * columnsCount;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * columnsCount - 1);

    return { startIndex, endIndex, startRow, endRow };
  }, [scrollTop, itemHeight, gap, containerHeight, rowsCount, columnsCount, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => {
      const actualIndex = startIndex + index;
      const row = Math.floor(actualIndex / columnsCount);
      const col = actualIndex % columnsCount;
      
      return {
        item,
        index: actualIndex,
        key: item.id || actualIndex,
        style: {
          position: 'absolute',
          left: col * (itemWidth + gap),
          top: row * (itemHeight + gap),
          width: itemWidth,
          height: itemHeight
        }
      };
    });
  }, [items, visibleRange, columnsCount, itemWidth, itemHeight, gap]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      className={`virtualized-grid ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      {...props}
    >
      <div
        className="virtualized-grid-inner"
        style={{ 
          height: totalHeight, 
          position: 'relative',
          width: '100%'
        }}
      >
        {visibleItems.map(({ item, index, key, style }) => (
          <div key={key} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedList;