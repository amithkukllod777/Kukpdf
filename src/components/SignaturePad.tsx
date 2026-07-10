import { useRef, useState } from 'react';

export default function SignaturePad({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = point(e);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2430';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasStroke(true);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  }

  function save() {
    if (!hasStroke) return;
    onSave(canvasRef.current!.toDataURL('image/png'));
  }

  return (
    <div className="modal">
      <div className="sheet">
        <h2>Draw your signature</h2>
        <canvas
          ref={canvasRef}
          width={320}
          height={160}
          className="signature-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
        <div className="actions">
          <button onClick={clear}>Clear</button>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={save} disabled={!hasStroke}>Save</button>
        </div>
      </div>
    </div>
  );
}
