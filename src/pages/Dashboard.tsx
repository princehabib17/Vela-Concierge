import { Link } from 'react-router-dom';
import { Sparkles, Box, Camera, Map, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <section className="space-y-2">
        <h2 className="text-3xl text-clay">Welcome to Vela</h2>
        <p className="text-cloud/70 font-normal leading-relaxed">
          Begin your bespoke journey. Design, configure, and track your custom piece with Master Jeweller Paul Ginocchi.
        </p>
      </section>

      <div className="grid gap-4">
        <Link to="/design" className="group relative overflow-hidden rounded-xl bg-midnight-80/50 border border-midnight-80/30 p-6 transition-all hover:border-clay/50">
          <div className="absolute inset-0 bg-gradient-to-br from-clay/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
              <div className="p-2 bg-midnight rounded-lg inline-block">
                <Sparkles className="text-clay" size={24} />
              </div>
              <h3 className="text-xl ">AI Design Generator</h3>
              <p className="text-sm text-cloud/60 font-normal">Describe your dream ring and see it visualized instantly.</p>
            </div>
            <ArrowRight className="text-cloud/30 group-hover:text-clay transition-colors" />
          </div>
        </Link>

        <Link to="/configurator" className="group relative overflow-hidden rounded-xl bg-midnight-80/50 border border-midnight-80/30 p-6 transition-all hover:border-clay/50">
          <div className="absolute inset-0 bg-gradient-to-br from-clay/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
              <div className="p-2 bg-midnight rounded-lg inline-block">
                <Box className="text-clay" size={24} />
              </div>
              <h3 className="text-xl ">3D Configurator</h3>
              <p className="text-sm text-cloud/60 font-normal">Build your ring in real-time 3D with precision controls.</p>
            </div>
            <ArrowRight className="text-cloud/30 group-hover:text-clay transition-colors" />
          </div>
        </Link>

        <Link to="/try-on" className="group relative overflow-hidden rounded-xl bg-midnight-80/50 border border-midnight-80/30 p-6 transition-all hover:border-clay/50">
          <div className="absolute inset-0 bg-gradient-to-br from-clay/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
              <div className="p-2 bg-midnight rounded-lg inline-block">
                <Camera className="text-clay" size={24} />
              </div>
              <h3 className="text-xl ">Virtual Try-On</h3>
              <p className="text-sm text-cloud/60 font-normal">See your design on your hand using AR technology.</p>
            </div>
            <ArrowRight className="text-cloud/30 group-hover:text-clay transition-colors" />
          </div>
        </Link>

        <Link to="/journey" className="group relative overflow-hidden rounded-xl bg-midnight-80/50 border border-midnight-80/30 p-6 transition-all hover:border-clay/50">
          <div className="absolute inset-0 bg-gradient-to-br from-clay/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
              <div className="p-2 bg-midnight rounded-lg inline-block">
                <Map className="text-clay" size={24} />
              </div>
              <h3 className="text-xl ">Vela Journey</h3>
              <p className="text-sm text-cloud/60 font-normal">Track your bespoke order from consultation to delivery.</p>
            </div>
            <ArrowRight className="text-cloud/30 group-hover:text-clay transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
