import { useRef, useState } from 'react';
import type { CropRect } from '../types';

const HANDLES = ['nw', 'ne', 'sw', 'se'] as const;
type Handle = (typeof HANDLES)[number];

export default function CropEditor({ dataUrl, initial, onApply, onCancel }: {
  dataUrl: string;
  initial?: CropRect;
  onApply: (crop: CropRect) => void;
  onCancel: () => void;
}) {
  const [rect, setRect] = useState<CropRect>(initial ?? { x: 0.06, y: 0.06, w: 0.88, h: 0.88 });
  const boxRef = useRef<HTMLDivElement>(null);
  const dragHandle = useRef<Handle | 'move' | null>(null);
  const dragStart = useRef({ x: 0, y: 0, rect });

  function toRatio(clientX: number, clientY: number) {
    const box = boxRef.current!.getBoundingClientRect();
    return { x: (clientX - box.left) / box.width, y: (clientY - box.top) / box.height };
  }

  function startDrag(handle: Handle | 'move') {
    return (e: React.PointerEvent) => {
      e.stopPropagation();
      dragHandle.current = handle;
      dragStart.current = { x: e.clientX, y: e.clientY, rect };
      (e.target as Element).setPointerCapture(e.pointerId);
    };
  }

  function onMove(e: React.PointerEvent) {
    if (!dragHandle.current) return;
    const box = boxRef.current!.getBoundingClientRect();
    const dx = (e.clientX - dragStart.current.x) / box.width;
    const dy = (e.clientY - dragStart.current.y) / box.height;
    const r0 = dragStart.current.rect;
    let next = { ...r0 };
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    if (dragHandle.current === 'move') {
      next.x = clamp01(r0.x + dx);
      next.y = clamp01(r0.y + dy);
      next.x = Math.min(next.x, 1 - next.w);
      next.y = Math.min(next.y, 1 - next.h);
    } else {
      if (dragHandle.current!.includes('w')) {
        const nx = clamp01(r0.x + dx);
        next.w = r0.w + (r0.x - nx);
        next.x = nx;
      }
      if (dragHandle.current!.includes('e')) {
        next.w = clamp01(r0.x + r0.w + dx) - r0.x;
      }
      if (dragHandle.current!.includes('n')) {
        const ny = clamp01(r0.y + dy);
        next.h = r0.h + (r0.y - ny);
        next.y = ny;
      }
      if (dragHandle.current!.includes('s')) {
        next.h = clamp01(r0.y + r0.h + dy) - r0.y;
      }
      next.w = Math.max(0.1, next.w);
      next.h = Math.max(0.1, next.h);
    }
    setRect(next);
  }

  function endDrag() {
    dragHandle.current = null;
  }

  return (
    <div className="modal">
      <div className="sheet crop-sheet">
        <h2>Crop page</h2>
        <div className="crop-stage" ref={boxRef} onPointerMove={onMove} onPointerUp={endDrag}>
          <img src={dataUrl} draggable={false} />
          <div
            className="crop-rect"
            style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}
            onPointerDown={startDrag('move')}
          >
            {HANDLES.map((h) => (
              <span key={h} className={`crop-handle ${h}`} onPointerDown={startDrag(h)} />
            ))}
          </div>
        </div>
        <div className="actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => setRect({ x: 0, y: 0, w: 1, h: 1 })}>Reset</button>
          <button onClick={() => onApply(rect)}>Apply crop</button>
        </div>
      </div>
    </div>
  );
}
