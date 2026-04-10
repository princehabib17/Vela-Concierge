import { Link } from 'react-router-dom';
import { Sparkles, Box, Camera, Map, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)' },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.25 } },
};

const cardStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.55 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

export default function Home() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="h-full min-h-0 overflow-y-auto pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]"
    >
      {/* Hero Section */}
      <section className="relative mb-6 h-[60vh] w-full overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-vela-black">
          {/* CSS-only hero: no hidden WebGL (avoids GPU work for an invisible canvas) */}
          {/* Static gold glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 75% 55% at 50% 30%, rgba(251,222,147,0.14) 0%, transparent 60%), radial-gradient(circle at 50% 100%, rgba(251,222,147,0.07) 0%, transparent 45%)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-vela-black via-vela-black/20 to-transparent pointer-events-none" />
        </div>
        
        <motion.div
          variants={stagger}
          className="pointer-events-none absolute bottom-0 left-0 right-0 flex flex-col justify-end p-6"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="vela-kicker mb-3"
          >
            The Atelier
          </motion.h2>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="vela-hero-title mb-4"
          >
            Craft Your <br/>
            <motion.span
              variants={fadeUp}
              transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="italic text-vela-gold"
            >
              Legacy
            </motion.span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="vela-type-body max-w-[280px] text-vela-light/70"
          >
            Experience the art of bespoke jewellery creation with Paul Ginocchi's 40 years of mastery.
          </motion.p>
        </motion.div>
      </section>

      <motion.div variants={cardStagger} className="vela-section-gap flex flex-col px-6">
        {/* Design Tools Grid */}
        <section className="grid grid-cols-1 gap-4">
          <motion.div variants={cardItem}>
          <Link to="/design/ai" className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-vela-gray/25 transition-colors hover:border-vela-gold/25">
            <img 
              src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop" 
              alt="AI Design" 
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vela-black/90 via-vela-black/40 to-transparent" />
            <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-vela-gold/30 bg-vela-black/50 backdrop-blur-md">
                <Sparkles className="text-vela-gold" size={14} />
              </div>
              <div>
                <h3 className="vela-type-section mb-1">AI Design</h3>
                <p className="vela-card-label">Generate concepts</p>
              </div>
            </div>
          </Link>
          </motion.div>

          <motion.div variants={cardItem}>
          <Link to="/design/3d" className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-vela-gray/25 transition-colors hover:border-vela-gold/25">
            <img
              src="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop"
              alt="3D Configurator"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vela-black/90 via-vela-black/40 to-transparent" />
            <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-vela-gold/30 bg-vela-black/50 backdrop-blur-md">
                <Box className="text-vela-gold" size={14} />
              </div>
              <div>
                <h3 className="vela-type-section mb-1">3D Build</h3>
                <p className="vela-card-label">Configure ring</p>
              </div>
            </div>
          </Link>
          </motion.div>
        </section>

        {/* Try On Section */}
        <motion.section variants={cardItem}>
          <Link to="/try-on" className="group relative block overflow-hidden rounded-xl border border-vela-gray/25 transition-colors hover:border-vela-gold/25">
            <div className="absolute inset-0 bg-gradient-to-r from-vela-black/90 via-vela-black/60 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1605100804763-247f66126e9e?q=80&w=800&auto=format&fit=crop" 
              alt="Virtual Try On" 
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-between p-5">
              <div>
                <h3 className="vela-type-card-hero mb-1 text-vela-gold">Virtual try-on</h3>
                <p className="vela-card-label text-vela-light/60">Experience in AR</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-vela-gold/10 backdrop-blur-md border border-vela-gold/30 flex items-center justify-center group-hover:bg-vela-gold group-hover:text-vela-black transition-colors">
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>
        </motion.section>

        {/* Active Journey Section */}
        <motion.section variants={cardItem} className="vela-card-surface relative overflow-hidden p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-vela-gold/5 rounded-full blur-2xl -mr-10 -mt-10" />
          
          <div className="flex items-start justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-serif mb-1">Your Vela Journey</h3>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-vela-gold">Active order</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-vela-black flex items-center justify-center border border-vela-gray/50">
              <Map className="text-vela-light/70" size={14} />
            </div>
          </div>
          
          <div className="relative pt-2 z-10">
            <div className="absolute left-[7px] top-4 bottom-0 w-[1px] bg-vela-gray/30" />
            
            <div className="flex gap-4 mb-2 relative">
              <div className="w-4 h-4 rounded-full bg-vela-gold flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(251,222,147,0.3)]">
                <div className="w-1.5 h-1.5 rounded-full bg-vela-black" />
              </div>
              <div>
                <h4 className="vela-type-ui-title">Design & Stone Selection</h4>
                <p className="vela-type-caption mt-1.5">Paul is currently sourcing sapphires based on your brief.</p>
              </div>
            </div>
            
            <Link to="/journey" className="group mt-6 inline-flex items-center gap-2 vela-kicker-text transition-colors hover:text-vela-light">
              View Full Timeline <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.section>
      </motion.div>
    </motion.div>
  );
}
