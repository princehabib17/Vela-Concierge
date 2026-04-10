import { useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
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
    <div className="p-6 pt-12 h-full overflow-y-auto flex flex-col">
      <header className="mb-8">
        <h1 className="text-2xl font-serif mb-2">AI Design Studio</h1>
        <p className="text-vela-light/60 text-sm font-light">Describe your dream ring, and our AI will visualize it for you.</p>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="relative mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Rose gold oval sapphire, delicate pavé band, under $3,000..."
            className="w-full bg-vela-dark border border-vela-gray/50 rounded-lg p-4 text-sm text-vela-light placeholder:text-vela-light/30 focus:outline-none focus:border-vela-gold/50 min-h-[120px] resize-none"
          />
          <button 
            onClick={generateImages}
            disabled={!prompt || isGenerating}
            className="absolute bottom-4 right-4 bg-vela-gold text-vela-black p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vela-gold-muted transition-all hover:scale-105"
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>

        {!images.length && !isGenerating && (
          <div className="space-y-3">
            <p className="text-xs text-vela-light/50 uppercase tracking-wider">Suggestions</p>
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => setPrompt(sug)}
                className="block w-full text-left p-4 rounded-lg border border-vela-gray/30 text-sm text-vela-light/80 hover:border-vela-gold/30 hover:text-vela-gold hover:bg-vela-dark transition-all"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center text-vela-gold">
            <Sparkles className="animate-pulse mb-4" size={32} strokeWidth={1} />
            <p className="text-sm font-serif italic">Visualizing your design...</p>
          </div>
        )}

        {images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="grid grid-cols-2 gap-3 mb-6">
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
                initial={{ opacity: 0 }}
                animate={{ opacity: selectedImage !== null ? 1 : 0.5 }}
                disabled={selectedImage === null}
                className="w-full bg-vela-gold text-vela-black py-4 rounded-lg font-medium tracking-wide uppercase text-sm hover:bg-vela-gold-muted transition-colors disabled:cursor-not-allowed"
              >
                {selectedImage !== null ? 'Save to Order Brief' : 'Select a Design'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
