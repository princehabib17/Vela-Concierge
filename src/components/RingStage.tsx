import { useEffect, useRef, useState } from 'react';
import { RingEngine, type Geometry, type Materials, type Mode } from '@/lib/ringEngine';

type Props = {
  geometry: Geometry;
  materials: Materials;
  mode: Mode;
  label: string;
};

/** The product render: pre-rendered Blender layers composited and animated in WebGL. */
export default function RingStage({ geometry, materials, mode, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<RingEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hint, setHint] = useState(true);
  const first = useRef({ geometry, materials });

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    try {
      const e = new RingEngine(canvas, overlay, { onReady: () => setReady(true) });
      engine.current = e;
      e.setMaterials(first.current.materials, true);
      void e.setGeometry(first.current.geometry);
      return () => {
        e.destroy();
        engine.current = null;
      };
    } catch {
      setFailed(true);
    }
  }, []);

  const { cut, setting, band } = geometry;
  useEffect(() => {
    if (!engine.current) return;
    void engine.current.setGeometry({ cut, setting, band });
  }, [cut, setting, band]);

  const { metal, gem } = materials;
  const firstMaterials = useRef(true);
  useEffect(() => {
    if (!engine.current) return;
    if (firstMaterials.current) {
      firstMaterials.current = false;
      return;
    }
    engine.current.setMaterials({ metal, gem });
  }, [metal, gem]);

  useEffect(() => {
    engine.current?.setMode(mode);
  }, [mode]);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
        <p className="lux-display text-base text-[#555]">This preview needs WebGL. Please try another browser.</p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 touch-pan-y select-none"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        engine.current?.pointerDown(e.clientX);
        setHint(false);
      }}
      onPointerMove={(e) => engine.current?.pointerMove(e.clientX, e.currentTarget.clientWidth)}
      onPointerUp={() => engine.current?.pointerUp()}
      onPointerCancel={() => engine.current?.pointerUp()}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: ready ? 1 : 0, transform: ready ? 'scale(1)' : 'scale(0.965)', transition: 'opacity 900ms ease, transform 1400ms cubic-bezier(0.22,1,0.36,1)' }}
      />
      <canvas ref={overlayRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />
      {!ready && (
        <p className="lux-display pointer-events-none absolute inset-0 flex animate-pulse items-center justify-center text-base italic text-black/40">
          Preparing your ring…
        </p>
      )}
      {ready && hint && (
        <p className="lux-ui pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 text-[9px] font-medium uppercase tracking-[0.22em] text-black/35">
          Drag to turn
        </p>
      )}
    </div>
  );
}
