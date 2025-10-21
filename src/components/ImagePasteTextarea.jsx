import React from 'react';

export default function ImagePasteTextarea({ 
  value = '', 
  onChange, 
  images = [], 
  onImagesChange,
  placeholder = "Descripción y Detalles Adicionales",
  ...props 
}) {
  
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        
        if (!onImagesChange) {
          console.warn('No onImagesChange handler provided');
          return;
        }
        
        const file = item.getAsFile();
        if (!file) return;
        
        // Validate size
        if (file.size > 5 * 1024 * 1024) {
          alert('Imagen muy grande (máximo 5MB)');
          return;
        }
        
        // Validate max images
        if (images.length >= 10) {
          alert('Máximo 10 imágenes permitidas');
          return;
        }
        
        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
          const newImage = {
            id: Date.now().toString() + Math.random(),
            dataUrl: reader.result,
            name: file.name || 'imagen.png'
          };
          
          onImagesChange([...images, newImage]);
        };
        reader.onerror = () => {
          alert('Error al cargar la imagen');
        };
        reader.readAsDataURL(file);
        
        break;
      }
    }
  };
  
  const deleteImage = (imageId) => {
    if (onImagesChange) {
      onImagesChange(images.filter(img => img.id !== imageId));
    }
  };
  
  const openImageFullSize = (dataUrl) => {
    window.open(dataUrl, '_blank');
  };
  
  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={onChange}  // ← CRITICAL: Must pass onChange directly
        onPaste={handlePaste}
        placeholder={placeholder}
        className="w-full min-h-[150px] p-3 border rounded-t resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
      
      {images && images.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border border-t-0 rounded-b bg-gray-50">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.dataUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-all"
                onClick={() => openImageFullSize(image.dataUrl)}
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteImage(image.id);
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-bold shadow-md"
                type="button"
                title="Eliminar imagen"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex items-center text-xs text-gray-500 ml-2">
            {images.length}/10 imágenes
          </div>
        </div>
      )}
    </div>
  );
}