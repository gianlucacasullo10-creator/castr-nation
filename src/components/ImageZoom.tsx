import { useState } from "react";
import { X } from "lucide-react";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

const ImageZoom = ({ src, alt, className }: ImageZoomProps) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div 
        className={className}
        onClick={() => setIsZoomed(true)}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover cursor-pointer" />
      </div>

      {isZoomed && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
          >
            <X size={32} />
          </button>
          <img 
            src={src} 
            alt={alt} 
            className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ImageZoom;
