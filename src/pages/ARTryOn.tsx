import { useState, useEffect, useRef } from 'react';
import { Camera, SwitchCamera, Share, AlertCircle, Scan } from 'lucide-react';

const controlsBottom = 'calc(5.5rem + env(safe-area-inset-bottom, 0px))';

export default function ARTryOn() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: isFrontCamera ? 'user' : 'environment' }
      })
      .then((stream) => {
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setHasPermission(false);
      });

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isFrontCamera]);

  if (hasPermission === false) {
    return (
      <div className="vela-page flex h-full min-h-0 flex-col items-center justify-center text-center">
        <AlertCircle className="text-clay" size={44} strokeWidth={1.25} aria-hidden />
        <h2 className="vela-type-card-hero mt-5">Camera access required</h2>
        <p className="vela-type-body mt-3 max-w-xs text-cloud/65">
          Enable camera access in your browser settings to use try-on.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 animate-in fade-in duration-500 overflow-hidden bg-midnight">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'scaleX(1)' }}
        className="h-full w-full object-cover transition-transform duration-300"
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative flex h-64 w-64 items-center justify-center">
          <Scan className="absolute inset-0 h-full w-full text-clay/35" strokeWidth={1} aria-hidden />
          <div className="h-32 w-32 rounded-full border border-clay/25" />
          <div className="absolute h-2 w-2 rounded-full bg-clay shadow-[0_0_12px_rgba(233,232,227,0.45)]" />
        </div>
        <div className="vela-kicker-text mt-6 rounded-full border border-clay/25 bg-midnight/70 px-5 py-2.5 backdrop-blur-md">
          Detecting hand
        </div>
      </div>

      <div
        className="absolute left-0 right-0 z-10 flex items-end justify-between px-8"
        style={{ bottom: controlsBottom }}
      >
        <button
          type="button"
          onClick={() => setIsFrontCamera(!isFrontCamera)}
          className="rounded-full border border-midnight-80/40 bg-midnight/70 p-3.5 text-cloud backdrop-blur-md transition-colors hover:border-clay/40 hover:bg-midnight-80/50"
          aria-label="Switch camera"
        >
          <SwitchCamera size={22} strokeWidth={1.25} />
        </button>

        <button
          type="button"
          className="rounded-full border-[3px] border-midnight bg-clay p-5 shadow-[0_0_0_1px_rgba(233,232,227,0.5)] transition-colors hover:bg-stone-40"
          aria-label="Capture"
        >
          <Camera size={28} strokeWidth={1.35} className="text-midnight" />
        </button>

        <button
          type="button"
          className="rounded-full border border-midnight-80/40 bg-midnight/70 p-3.5 text-cloud backdrop-blur-md transition-colors hover:border-clay/40 hover:bg-midnight-80/50"
          aria-label="Share"
        >
          <Share size={22} strokeWidth={1.25} />
        </button>
      </div>

      <div className="absolute left-0 right-0 top-5 z-10 flex justify-center px-6">
        <p className="inline-block rounded-full border border-midnight-80/35 bg-midnight/65 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cloud/88 backdrop-blur-md">
          Place your left hand in view
        </p>
      </div>
    </div>
  );
}
