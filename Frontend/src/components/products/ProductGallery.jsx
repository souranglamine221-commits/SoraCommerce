// Frontend/src/components/products/ProductGallery.jsx
import React, { useState } from 'react';
import { ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

const ProductGallery = ({ images, mainImage }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Combiner l'image principale avec le tableau d'images
  const allImages = mainImage ? [mainImage, ...(images || [])] : (images || []);

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Aucune image</span>
      </div>
    );
  }

  const handlePrevious = () => {
    setSelectedImage(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Image principale */}
      <div
        className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in ${
          isZoomed ? 'cursor-zoom-out' : ''
        }`}
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <img
          src={allImages[selectedImage] || '/placeholder.jpg'}
          alt="Product"
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
        />
        
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-2 right-2 p-2 bg-white/80 rounded-full shadow-md">
          <ZoomIn className="h-4 w-4 text-gray-600" />
        </div>
      </div>

      {/* Miniatures */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                selectedImage === index
                  ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image || '/placeholder.jpg'}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
