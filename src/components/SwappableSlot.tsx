import type { ReactNode } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface SwappableSlotProps {
  /** The id of whoever currently occupies this slot (a player id in random mode, a team id in fixed mode). */
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * Every slot in a round can be both dragged FROM and dropped ONTO — dropping
 * one slot on another simply swaps their two occupants. Rather than model
 * "drag source" and "drop target" separately, this merges dnd-kit's
 * useDraggable and useDroppable onto the same node, keyed by the id of
 * whoever is standing in that slot right now.
 */
export function SwappableSlot({ id, children, disabled }: SwappableSlotProps) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id, disabled });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id, disabled });

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`touch-none select-none rounded-xl transition-shadow duration-150 ${isDragging ? 'opacity-40 z-50 relative' : ''} ${
        isOver && !isDragging ? 'ring-2 ring-court ring-offset-2 ring-offset-mist' : ''
      } ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {children}
    </div>
  );
}
