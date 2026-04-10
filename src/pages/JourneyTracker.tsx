import { useState } from 'react';
import { CheckCircle2, Circle, Heart, Sparkles, Flame, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type Reaction = 'heart' | 'sparkles' | 'fire' | null;

export default function JourneyTracker() {
  const [reaction, setReaction] = useState<Reaction>(null);

  const stages = [
    {
      id: 1,
      title: 'Discovery & Consultation Confirmed',
      status: 'completed',
      date: 'Oct 12, 2026',
      note: 'Wonderful meeting you both. I have a clear vision of the vintage-inspired setting you are looking for.',
      staff: 'Sara Kim',
      media: null
    },
    {
      id: 2,
      title: 'Design & Stone Selection',
      status: 'active',
      date: 'Oct 18, 2026',
      note: 'I\'ve sourced three beautiful Montana sapphires that match your color preference. The middle one has exceptional clarity.',
      staff: 'Paul Ginocchi',
      media: 'https://images.unsplash.com/photo-1599643478514-4a888f1971c2?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 3,
      title: '3D Visualization & Approval',
      status: 'upcoming',
      date: null,
      note: null,
      staff: null,
      media: null
    },
    {
      id: 4,
      title: 'Craftsmanship & Delivery',
      status: 'upcoming',
      date: null,
      note: null,
      staff: null,
      media: null
    }
  ];

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 pt-12 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-serif mb-2">Your Vela Journey</h1>
        <p className="text-vela-light/60 text-sm font-light">Order #VJ-8842</p>
      </header>

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[15px] top-4 bottom-8 w-[1px] bg-vela-gray/50" />

        <div className="space-y-8">
          {stages.map((stage, index) => (
            <div key={stage.id} className="relative z-10 flex gap-4">
              <div className="shrink-0 mt-1">
                {stage.status === 'completed' ? (
                  <div className="w-8 h-8 rounded-full bg-vela-gold/20 flex items-center justify-center">
                    <CheckCircle2 className="text-vela-gold" size={20} />
                  </div>
                ) : stage.status === 'active' ? (
                  <div className="w-8 h-8 rounded-full bg-vela-gold flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-vela-black" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-vela-dark border border-vela-gray flex items-center justify-center">
                    <Circle className="text-vela-gray" size={12} />
                  </div>
                )}
              </div>

              <div className={cn(
                "flex-1 pb-2",
                stage.status === 'upcoming' && "opacity-50"
              )}>
                <h3 className={cn(
                  "text-lg font-serif mb-1",
                  stage.status === 'active' ? "text-vela-gold" : "text-vela-light"
                )}>
                  {stage.title}
                </h3>
                
                {stage.date && (
                  <p className="text-xs text-vela-light/50 uppercase tracking-wider mb-3">{stage.date}</p>
                )}

                {(stage.note || stage.media) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-vela-dark border border-vela-gray/30 rounded-lg p-4 mt-2"
                  >
                    {stage.media && (
                      <div className="relative rounded-md overflow-hidden mb-3 aspect-video">
                        <img src={stage.media} alt="Update media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Play className="text-white ml-1" size={16} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {stage.note && (
                      <p className="text-sm text-vela-light/80 leading-relaxed mb-3">"{stage.note}"</p>
                    )}
                    
                    {stage.staff && (
                      <div className="flex items-center justify-between border-t border-vela-gray/30 pt-3">
                        <p className="text-xs text-vela-light/50">— {stage.staff}</p>
                        
                        {stage.status === 'active' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setReaction(reaction === 'heart' ? null : 'heart')}
                              className={cn("p-1.5 rounded-full transition-colors", reaction === 'heart' ? "bg-vela-gold/20" : "hover:bg-vela-gray/50")}
                            >
                              <Heart size={14} className={reaction === 'heart' ? "fill-vela-gold text-vela-gold" : "text-vela-light/50"} />
                            </button>
                            <button 
                              onClick={() => setReaction(reaction === 'sparkles' ? null : 'sparkles')}
                              className={cn("p-1.5 rounded-full transition-colors", reaction === 'sparkles' ? "bg-vela-gold/20" : "hover:bg-vela-gray/50")}
                            >
                              <Sparkles size={14} className={reaction === 'sparkles' ? "fill-vela-gold text-vela-gold" : "text-vela-light/50"} />
                            </button>
                            <button 
                              onClick={() => setReaction(reaction === 'fire' ? null : 'fire')}
                              className={cn("p-1.5 rounded-full transition-colors", reaction === 'fire' ? "bg-vela-gold/20" : "hover:bg-vela-gray/50")}
                            >
                              <Flame size={14} className={reaction === 'fire' ? "fill-vela-gold text-vela-gold" : "text-vela-light/50"} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
