import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function AIGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const suggestions = [
    "Rose gold oval sapphire, delicate pavé band",
    "Platinum emerald cut diamond, bezel setting",
    "Yellow gold pear moissanite, hidden halo",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setImages([]);
    setSelectedImage(null);
    
    try {
      // In a real app, this would call the Nanobanana API via Supabase Edge Function
      // For this prototype, we'll use Gemini to generate a description and then use placeholder images
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Describe a luxury ring based on this prompt: "${prompt}". Keep it to one short sentence.`,
      });
      
      // Simulate API delay and return placeholder images
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Using high-quality placeholder images that look like jewelry
      setImages([
        `https://images.unsplash.com/photo-1605100804763-247f66156ce4?auto=format&fit=crop&w=400&q=80`,
        `https://images.unsplash.com/photo-1599643478524-fb66f70d00ea?auto=format&fit=crop&w=400&q=80`,
        `https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=400&q=80`,
        `https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80`
      ]);
    } catch (error) {
      console.error("Failed to generate:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="space-y-2">
        <h2 className="text-2xl font-serif text-vela-gold">AI Design Generator</h2>
        <p className="text-sm text-vela-light/70 font-light">
          Describe your vision, and our AI will visualize it.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Rose gold oval sapphire, delicate pavé band..."
            className="w-full bg-vela-dark border border-vela-gray/50 rounded-xl p-4 text-vela-light placeholder:text-vela-light/30 focus:outline-none focus:border-vela-gold/50 min-h-[120px] resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="absolute bottom-4 right-4 bg-vela-gold text-vela-black p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vela-gold-muted transition-colors"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setPrompt(suggestion)}
              className="text-xs border border-vela-gray/50 rounded-full px-3 py-1.5 text-vela-light/70 hover:border-vela-gold/50 hover:text-vela-gold transition-colors text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-vela-gray/30">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-lg">Generated Concepts</h3>
            <button 
              onClick={handleGenerate}
              className="text-vela-gold text-sm flex items-center gap-1 hover:text-vela-gold-muted"
            >
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {images.map((img, i) => (
              <div 
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedImage === i ? 'border-vela-gold' : 'border-transparent hover:border-vela-gray'}`}
              >
                <img src={img} alt={`Generated concept ${i+1}`} className="w-full h-full object-cover" />
                {selectedImage === i && (
                  <div className="absolute top-2 right-2 bg-vela-gold text-vela-black p-1 rounded-full">
                    <Check size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedImage !== null && (
            <button className="w-full bg-vela-gold text-vela-black font-medium py-4 rounded-xl mt-4 hover:bg-vela-gold-muted transition-colors">
              Save to Order Brief
            </button>
          )}
        </div>
      )}
    </div>
  );
}
