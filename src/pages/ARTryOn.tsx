import { useState, useEffect, useRef } from 'react';
import { Camera, SwitchCamera, Share, AlertCircle, Scan } from 'lucide-react';

export default function ARTryOn() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Request camera permission
    navigator.mediaDevices.getUserMedia({ 
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
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isFrontCamera]);

  if (hasPermission === false) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto p-6 text-center space-y-4">
        <AlertCircle className="text-vela-gold" size={48} />
        <h2 className="text-xl font-serif">Camera Access Required</h2>
        <p className="text-vela-light/70 font-light text-sm">
          Please enable camera access in your browser settings to use the AR Try-On feature.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-vela-black animate-in fade-in duration-500">
      {/* Camera Feed Placeholder / Video Element */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'scaleX(1)' }}
        className="w-full h-full object-cover transition-transform duration-300"
      />

      {/* AR Overlay Simulation */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Scanning reticle */}
          <Scan className="absolute inset-0 w-full h-full text-vela-gold/40 animate-pulse" strokeWidth={1} />
          <div className="w-32 h-32 border border-vela-gold/30 rounded-full animate-[spin_4s_linear_infinite]" />
          <div className="absolute w-2 h-2 bg-vela-gold rounded-full shadow-[0_0_10px_#FBDE93]" />
        </div>
        <div className="mt-8 text-vela-gold text-xs font-mono tracking-widest bg-vela-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-vela-gold/20">
          DETECTING HAND...
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-24 left-0 right-0 px-8 flex justify-between items-end z-10">
        <button 
          onClick={() => setIsFrontCamera(!isFrontCamera)}
          className="bg-vela-black/60 backdrop-blur-md p-4 rounded-full border border-vela-gray/50 text-vela-light hover:bg-vela-dark hover:border-vela-gold/50 transition-all"
        >
          <SwitchCamera size={24} />
        </button>

        <button className="bg-vela-gold p-6 rounded-full border-4 border-vela-black shadow-[0_0_0_2px_#FBDE93] hover:bg-vela-gold-muted hover:scale-105 transition-all">
          <Camera size={32} className="text-vela-black" />
        </button>

        <button className="bg-vela-black/60 backdrop-blur-md p-4 rounded-full border border-vela-gray/50 text-vela-light hover:bg-vela-dark hover:border-vela-gold/50 transition-all">
          <Share size={24} />
        </button>
      </div>

      <div className="absolute top-6 left-0 right-0 text-center z-10">
        <p className="bg-vela-black/60 backdrop-blur-md inline-block px-6 py-2.5 rounded-full text-xs font-medium tracking-wide text-vela-light/90 border border-vela-gray/50 shadow-lg">
          Place your left hand in view
        </p>
      </div>
    </div>
  );
}
