import { Link } from 'react-router-dom';
import { Sparkles, Box, Map, ArrowRight } from 'lucide-react';
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

/** Brand photography is moody and close to monochrome: product images are toned to match. */
const PHOTO = 'absolute inset-0 h-full w-full object-cover opacity-55 grayscale-[0.85] contrast-[1.05] transition-transform duration-700 group-hover:scale-105';

export default function Home() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="h-full min-h-0 overflow-y-auto pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]"
    >
      {/* Hero */}
      <section className="relative mb-6 h-[60vh] w-full overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-midnight">
          {/* CSS-only hero: a soft Stone light falling on Midnight (no hidden WebGL). */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 75% 55% at 50% 28%, rgba(97,97,97,0.42) 0%, transparent 62%), radial-gradient(circle at 50% 100%, rgba(233,232,227,0.06) 0%, transparent 45%)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent" />
        </div>

        <motion.div variants={stagger} className="pointer-events-none absolute bottom-0 left-0 right-0 flex flex-col justify-end p-6">
          {/* The style sheet's line: the star submark over "Attainable luxury". */}
          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: 'easeOut' }} className="mb-5 flex items-center gap-3">
            <span aria-hidden className="vela-mark vela-mark-star w-4 text-clay" />
            <p className="vela-kicker-text">Attainable luxury</p>
          </motion.div>
          <motion.h1 variants={fadeUp} transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }} className="vela-hero-title mb-4">
            Craft your
            <br />
            legacy
          </motion.h1>
          <motion.p variants={fadeUp} transition={{ duration: 0.7, ease: 'easeOut' }} className="vela-type-body max-w-[280px] text-cloud/70">
            Experience the art of bespoke jewellery creation with Paul Ginocchi's 40 years of mastery.
          </motion.p>
        </motion.div>
      </section>

      <motion.div variants={cardStagger} className="vela-section-gap flex flex-col px-6">
        {/* Design tools */}
        <section className="grid grid-cols-1 gap-4">
          <motion.div variants={cardItem}>
            <Link to="/design/ai" className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-stone/40 transition-colors hover:border-clay/40">
              <img
                src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop"
                alt="AI Design"
                className={PHOTO}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/40 to-transparent" />
              <div className="absolute inset-0 z-10 flex flex-col justify-between p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-clay/30 bg-midnight/50 backdrop-blur-md">
                  <Sparkles className="text-clay" size={14} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="vela-type-section mb-1.5">AI Design</h3>
                  <p className="vela-card-label">Generate concepts</p>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div variants={cardItem}>
            <Link to="/design/3d" className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-stone/40 transition-colors hover:border-clay/40">
              <img
                src="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop"
                alt="3D Configurator"
                className={PHOTO}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/40 to-transparent" />
              <div className="absolute inset-0 z-10 flex flex-col justify-between p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-clay/30 bg-midnight/50 backdrop-blur-md">
                  <Box className="text-clay" size={14} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="vela-type-section mb-1.5">3D Build</h3>
                  <p className="vela-card-label">Design your ring live</p>
                </div>
              </div>
            </Link>
          </motion.div>
        </section>

        {/* Try on */}
        <motion.section variants={cardItem}>
          <Link to="/try-on" className="group relative block overflow-hidden rounded-2xl border border-stone/40 transition-colors hover:border-clay/40">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-midnight/90 via-midnight/60 to-transparent" />
            <img
              src="https://images.unsplash.com/photo-1605100804763-247f66126e9e?q=80&w=800&auto=format&fit=crop"
              alt="Virtual Try On"
              className="h-32 w-full object-cover opacity-70 grayscale-[0.85] transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-between p-5">
              <div>
                <h3 className="vela-type-card-hero mb-1.5">Virtual try-on</h3>
                <p className="vela-card-label">Experience in AR</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-clay/30 bg-midnight/40 text-clay backdrop-blur-md transition-colors group-hover:bg-cloud group-hover:text-midnight">
                <ArrowRight size={18} strokeWidth={1.5} />
              </div>
            </div>
          </Link>
        </motion.section>

        {/* Active journey */}
        <motion.section variants={cardItem} className="vela-card-surface relative overflow-hidden p-6">
          <div className="relative z-10 mb-6 flex items-start justify-between">
            <div>
              <h3 className="vela-type-section mb-1.5">Your Vela journey</h3>
              <p className="vela-kicker-text">Active order</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-stone/50 bg-midnight">
              <Map className="text-cloud/70" size={14} strokeWidth={1.5} />
            </div>
          </div>

          <div className="relative z-10 pt-2">
            <div className="absolute bottom-0 left-[7px] top-4 w-px bg-stone/40" />
            <div className="relative mb-2 flex gap-4">
              <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cloud">
                <div className="h-1.5 w-1.5 rounded-full bg-midnight" />
              </div>
              <div>
                <h4 className="vela-type-ui-title">Design &amp; Stone Selection</h4>
                <p className="vela-type-caption mt-1.5">Paul is currently sourcing sapphires based on your brief.</p>
              </div>
            </div>
            <Link to="/journey" className="vela-kicker-text group mt-6 inline-flex items-center gap-2 transition-colors hover:text-cloud">
              View full timeline <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.section>

        {/* The house seal on the brand pattern */}
        <motion.section variants={cardItem}>
          <a
            href="https://velajewellers.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit velajewellers.com"
            className="vela-pattern group flex h-60 items-center justify-center overflow-hidden rounded-2xl"
          >
            <span className="flex size-44 items-center justify-center rounded-full bg-cloud shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-transform duration-700 group-hover:scale-[1.03]">
              <span aria-hidden className="vela-mark vela-mark-seal w-36 text-midnight" />
            </span>
          </a>
        </motion.section>
      </motion.div>
    </motion.div>
  );
}
