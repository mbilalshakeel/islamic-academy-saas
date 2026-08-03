"use client";

import { useEffect, useState } from "react";

/**
 * Minimal native-HTML5-DnD reorderable list wrapper. Renders children via
 * `renderItem`, and calls `onReorder` with the new full ordering (as
 * {id, sort_order} pairs, 1-indexed) once a drag completes.
 */
export function DragReorderList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (order: Array<{ id: string; sort_order: number }>) => void;
  renderItem: (item: T, index: number, dragHandleProps: { draggable: boolean; onDragStart: () => void }) => React.ReactNode;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState(items);

  // Keep local copy in sync when parent data changes (e.g. after reload).
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const reordered = [...localItems];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setLocalItems(reordered);
    setDragIndex(null);
    onReorder(reordered.map((item, i) => ({ id: item.id, sort_order: i + 1 })));
  }

  return (
    <div className="space-y-2">
      {localItems.map((item, index) => (
        <div
          key={item.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(index)}
        >
          {renderItem(item, index, {
            draggable: true,
            onDragStart: () => setDragIndex(index),
          })}
        </div>
      ))}
    </div>
  );
}

