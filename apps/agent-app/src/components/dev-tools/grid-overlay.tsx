import { useDevTools } from "@/contexts/dev-tools-context";
import { useEffect, useState, useCallback } from "react";

interface LayoutInfo {
  id: string;
  type: 'container' | 'grid' | 'flex';
  rect: DOMRect;
  columns?: number;
  gap?: { row: number; column: number };
  padding: { top: number; right: number; bottom: number; left: number };
  maxWidth?: string;
  columnWidths?: number[];
  flexDirection?: string;
  childCount?: number;
  className?: string;
}

export function GridOverlay() {
  const { showGridOverlay } = useDevTools();
  const [layouts, setLayouts] = useState<LayoutInfo[]>([]);

  const scanForLayouts = useCallback(() => {
    if (!showGridOverlay) return;

    const detectedLayouts: LayoutInfo[] = [];
    let layoutId = 0;

    // First, find the main page container
    const pageContainers = document.querySelectorAll('[class*="max-w-"]');
    pageContainers.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.closest('[data-grid-overlay]')) return;
      
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      // Skip small or off-screen elements
      if (rect.width < 200 || rect.height < 100) return;
      if (rect.bottom < 0 || rect.top > window.innerHeight + 500) return;

      const maxWidth = styles.maxWidth;
      if (maxWidth && maxWidth !== 'none') {
        detectedLayouts.push({
          id: `container-${layoutId++}`,
          type: 'container',
          rect,
          maxWidth,
          padding: {
            top: parseFloat(styles.paddingTop) || 0,
            right: parseFloat(styles.paddingRight) || 0,
            bottom: parseFloat(styles.paddingBottom) || 0,
            left: parseFloat(styles.paddingLeft) || 0,
          },
          className: el.className,
        });
      }
    });

    // Find CSS Grid elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.closest('[data-grid-overlay]')) return;
      
      const styles = window.getComputedStyle(el);
      const display = styles.display;
      const rect = el.getBoundingClientRect();

      // Skip small or off-screen elements
      if (rect.width < 100 || rect.height < 50) return;
      if (rect.bottom < 0 || rect.top > window.innerHeight + 500) return;

      if (display === 'grid' || display === 'inline-grid') {
        const gridTemplateColumns = styles.gridTemplateColumns;
        const columnWidthStrings = gridTemplateColumns.split(' ').filter(v => v && v !== 'none');
        const columnWidths = columnWidthStrings.map(w => parseFloat(w) || 0).filter(w => w > 0);
        
        if (columnWidths.length > 0) {
          detectedLayouts.push({
            id: `grid-${layoutId++}`,
            type: 'grid',
            rect,
            columns: columnWidths.length,
            columnWidths,
            gap: {
              row: parseFloat(styles.rowGap) || 0,
              column: parseFloat(styles.columnGap) || 0,
            },
            padding: {
              top: parseFloat(styles.paddingTop) || 0,
              right: parseFloat(styles.paddingRight) || 0,
              bottom: parseFloat(styles.paddingBottom) || 0,
              left: parseFloat(styles.paddingLeft) || 0,
            },
            className: el.className,
          });
        }
      } else if (display === 'flex' || display === 'inline-flex') {
        // Only show flex containers with multiple children
        const childCount = el.children.length;
        if (childCount < 2) return;
        
        // Skip if it's a small inline element
        if (rect.height < 40) return;

        detectedLayouts.push({
          id: `flex-${layoutId++}`,
          type: 'flex',
          rect,
          flexDirection: styles.flexDirection,
          childCount,
          gap: {
            row: parseFloat(styles.rowGap) || 0,
            column: parseFloat(styles.columnGap) || parseFloat(styles.gap) || 0,
          },
          padding: {
            top: parseFloat(styles.paddingTop) || 0,
            right: parseFloat(styles.paddingRight) || 0,
            bottom: parseFloat(styles.paddingBottom) || 0,
            left: parseFloat(styles.paddingLeft) || 0,
          },
          className: el.className,
        });
      }
    });

    setLayouts(detectedLayouts);
  }, [showGridOverlay]);

  useEffect(() => {
    if (!showGridOverlay) {
      setLayouts([]);
      return;
    }

    // Initial scan
    const initialTimeout = setTimeout(scanForLayouts, 50);

    const handleUpdate = () => {
      requestAnimationFrame(scanForLayouts);
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    const observer = new MutationObserver(handleUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    const interval = setInterval(scanForLayouts, 500);

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      observer.disconnect();
      clearInterval(interval);
    };
  }, [showGridOverlay, scanForLayouts]);

  if (!showGridOverlay) return null;

  // Separate layouts by type for layering
  const containers = layouts.filter(l => l.type === 'container');
  const grids = layouts.filter(l => l.type === 'grid');
  const flexes = layouts.filter(l => l.type === 'flex');

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" data-grid-overlay>
      {/* Containers first (bottom layer) */}
      {containers.map((layout, index) => (
        <ContainerVisualizer key={layout.id} layout={layout} index={index} />
      ))}
      
      {/* Flex layouts */}
      {flexes.map((layout, index) => (
        <FlexVisualizer key={layout.id} layout={layout} index={index} />
      ))}
      
      {/* Grid layouts on top */}
      {grids.map((layout, index) => (
        <GridVisualizer key={layout.id} layout={layout} index={index} />
      ))}
      
      {/* Legend */}
      <div 
        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs font-medium space-y-1.5"
        style={{ fontFamily: 'Figtree, sans-serif' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(63, 63, 180, 0.3)', border: '1px solid #3F3FB4' }} />
          <span>Container (max-width)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(0, 109, 119, 0.3)', border: '1px solid #006D77' }} />
          <span>CSS Grid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(156, 79, 150, 0.3)', border: '1px solid #9C4F96' }} />
          <span>Flexbox</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(246, 68, 92, 0.2)', border: '1px dashed #F6445C' }} />
          <span>Padding</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(237, 153, 23, 0.2)', border: '1px dashed #ED9917' }} />
          <span>Gap</span>
        </div>
      </div>
    </div>
  );
}

function ContainerVisualizer({ layout, index }: { layout: LayoutInfo; index: number }) {
  const color = { bg: 'rgba(63, 63, 180, 0.08)', border: 'rgba(63, 63, 180, 0.5)', text: '#3F3FB4' };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: layout.rect.left,
          top: layout.rect.top,
          width: layout.rect.width,
          height: Math.min(layout.rect.height, window.innerHeight - layout.rect.top + 100),
          border: `2px solid ${color.border}`,
          backgroundColor: color.bg,
          borderRadius: '8px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: color.text,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'Figtree, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          Container • {layout.maxWidth} • {Math.round(layout.rect.width)}px actual
        </div>
      </div>

      {/* Padding indicators */}
      {layout.padding.left > 0 && (
        <PaddingIndicator 
          rect={layout.rect} 
          side="left" 
          value={layout.padding.left} 
        />
      )}
      {layout.padding.right > 0 && (
        <PaddingIndicator 
          rect={layout.rect} 
          side="right" 
          value={layout.padding.right} 
        />
      )}
    </>
  );
}

function GridVisualizer({ layout, index }: { layout: LayoutInfo; index: number }) {
  const color = { bg: 'rgba(0, 109, 119, 0.12)', border: 'rgba(0, 109, 119, 0.6)', text: '#006D77' };
  
  const contentLeft = layout.rect.left + layout.padding.left;
  const contentTop = layout.rect.top + layout.padding.top;
  const contentHeight = layout.rect.height - layout.padding.top - layout.padding.bottom;

  const columnPositions: { left: number; width: number }[] = [];
  let currentLeft = 0;

  (layout.columnWidths || []).forEach((width, i) => {
    columnPositions.push({ left: currentLeft, width });
    currentLeft += width + (i < (layout.columnWidths?.length || 0) - 1 ? (layout.gap?.column || 0) : 0);
  });

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: layout.rect.left,
          top: layout.rect.top,
          width: layout.rect.width,
          height: layout.rect.height,
          border: `2px solid ${color.border}`,
          borderRadius: '6px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -28,
            left: 0,
            backgroundColor: color.text,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'Figtree, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          Grid • {layout.columns} cols • gap: {layout.gap?.column || 0}px
        </div>
      </div>

      {columnPositions.map((col, colIndex) => (
        <div
          key={colIndex}
          style={{
            position: 'fixed',
            left: contentLeft + col.left,
            top: contentTop,
            width: col.width,
            height: contentHeight,
            backgroundColor: color.bg,
            borderLeft: `1px dashed ${color.border}`,
            borderRight: `1px dashed ${color.border}`,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', paddingTop: '8px' }}>
            <span style={{ backgroundColor: color.text, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: 'Figtree, sans-serif' }}>
              {colIndex + 1}
            </span>
            <span style={{ backgroundColor: 'white', color: color.text, padding: '1px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 600, fontFamily: 'Figtree, sans-serif', border: `1px solid ${color.border}` }}>
              {Math.round(col.width)}px
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

function FlexVisualizer({ layout, index }: { layout: LayoutInfo; index: number }) {
  const color = { bg: 'rgba(156, 79, 150, 0.08)', border: 'rgba(156, 79, 150, 0.5)', text: '#9C4F96' };
  const isRow = layout.flexDirection === 'row' || layout.flexDirection === 'row-reverse';
  
  return (
    <div
      style={{
        position: 'fixed',
        left: layout.rect.left,
        top: layout.rect.top,
        width: layout.rect.width,
        height: layout.rect.height,
        border: `1.5px dashed ${color.border}`,
        backgroundColor: color.bg,
        borderRadius: '4px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -24,
          left: 0,
          backgroundColor: color.text,
          color: 'white',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 600,
          fontFamily: 'Figtree, sans-serif',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        }}
      >
        Flex {isRow ? '→' : '↓'} • {layout.childCount} items{layout.gap?.column ? ` • gap: ${layout.gap.column}px` : ''}
      </div>
    </div>
  );
}

function PaddingIndicator({ rect, side, value }: { rect: DOMRect; side: 'left' | 'right'; value: number }) {
  const isLeft = side === 'left';
  
  return (
    <div
      style={{
        position: 'fixed',
        left: isLeft ? rect.left : rect.right - value,
        top: rect.top,
        width: value,
        height: Math.min(rect.height, window.innerHeight - rect.top + 100),
        backgroundColor: 'rgba(246, 68, 92, 0.12)',
        borderLeft: isLeft ? 'none' : '2px dashed rgba(246, 68, 92, 0.5)',
        borderRight: isLeft ? '2px dashed rgba(246, 68, 92, 0.5)' : 'none',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '60px',
      }}
    >
      <span
        style={{
          fontSize: '9px',
          color: '#F6445C',
          fontWeight: 700,
          fontFamily: 'Figtree, sans-serif',
          writingMode: 'vertical-rl',
          transform: isLeft ? 'rotate(180deg)' : 'none',
          backgroundColor: 'white',
          padding: '2px 3px',
          borderRadius: '3px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {Math.round(value)}px
      </span>
    </div>
  );
}
