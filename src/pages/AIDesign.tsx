import { useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shell/PageShell';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API safely
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' });
} catch (e) {
  console.warn("GoogleGenAI init failed:", e);
  ai = {} as GoogleGenAI;
}

export default function AIDesign() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const suggestions = [
    "Rose gold oval sapphire, delicate pavé band",
    "Platinum emerald cut diamond, bezel setting",
    "Yellow gold vintage inspired ruby ring"
  ];

  const generateImages = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setImages([]);
    setSelectedImage(null);
    
    try {
      // In a real app, this would call Nanobanana via Supabase Edge Function.
      // Here we use Gemini to generate a description, then use a placeholder image service
      // since Gemini doesn't generate images directly in this setup.
      
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Describe a beautiful, high-end fine jewellery ring based on this prompt: "${prompt}". Keep it to one short paragraph. Focus on the visual details, lighting, and luxurious feel.`,
      });
      
      // Simulate image generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Using highly curated, beautiful jewelry images to ensure the prototype looks premium
      // rather than random unsplash queries which often return irrelevant results.
      setImages([
        `https://images.unsplash.com/photo-1605100804763-247f66126e9e?q=80&w=800&auto=format&fit=crop`,
        `https://images.unsplash.com/photo-1599643478514-4a888f1971c2?q=80&w=800&auto=format&fit=crop`,
        `https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=800&auto=format&fit=crop`,
        `https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop`
      ]);
      
    } catch (error) {
      console.error("Error generating design:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PageShell
      kicker="Concepts"
      title="AI Design Studio"
      subtitle="Describe your dream ring. We translate your words into visual directions you can refine with Paul."
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Rose gold oval sapphire, delicate pavé band, under $3,000..."
            className="vela-type-body min-h-[120px] w-full resize-none rounded-xl border border-vela-gray/30 bg-vela-dark p-4 text-vela-light placeholder:text-vela-light/35 focus:border-vela-gold/45 focus:outline-none"
          />
          <button
            type="button"
            onClick={generateImages}
            disabled={!prompt || isGenerating}
            className="absolute bottom-4 right-4 bg-vela-gold text-vela-black p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vela-gold-muted transition-all hover:scale-105"
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>

        {!images.length && !isGenerating && (
          <div className="vela-stack-tight">
            <p className="vela-kicker mb-3">Suggestions</p>
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(sug)}
                className="vela-type-body block w-full rounded-xl border border-vela-gray/25 bg-vela-dark/40 p-4 text-left text-vela-light/80 transition-all hover:border-vela-gold/35 hover:bg-vela-dark hover:text-vela-gold"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center text-vela-gold">
            <Sparkles className="animate-pulse mb-4" size={32} strokeWidth={1} />
            <p className="font-serif text-sm font-normal italic text-vela-gold/90">Visualizing your design…</p>
          </div>
        )}

        {images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-6 grid grid-cols-2 gap-3">
              {images.map((img, i) => (
                <div 
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-300",
                    selectedImage === i ? "border-vela-gold scale-[0.98]" : "border-transparent hover:border-vela-gray/50"
                  )}
                >
                  <img src={img} alt={`Generated design ${i+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className={cn(
                    "absolute inset-0 transition-colors duration-300",
                    selectedImage === i ? "bg-vela-gold/10" : "bg-black/20 hover:bg-transparent"
                  )} />
                  {selectedImage === i && (
                    <div className="absolute top-3 right-3 bg-vela-gold text-vela-black p-1.5 rounded-full shadow-lg">
                      <Heart size={14} className="fill-vela-black" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4">
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: selectedImage !== null ? 1 : 0.5 }}
                disabled={selectedImage === null}
                className="vela-btn-primary w-full disabled:opacity-50"
              >
                {selectedImage !== null ? 'Save to Order Brief' : 'Select a Design'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
