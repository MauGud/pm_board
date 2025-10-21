import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function RichTextArea({ 
  value = '', 
  onChange, 
  placeholder = '', 
  rows = 3,
  disabled = false,
  maxImages = 10,
  maxSizeMB = 5,
  className = ''
}) {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);

  // Generate unique ID for new image
  const generateImageId = () => {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Validate file
  const validateFile = (file) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no soportado. Solo se permiten PNG, JPG, JPEG, GIF y WebP.');
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`El archivo es demasiado grande. Máximo ${maxSizeMB}MB.`);
    }
    
    if (images.length >= maxImages) {
      throw new Error(`Máximo ${maxImages} imágenes por campo.`);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Process uploaded files
  const processFiles = async (files) => {
    if (disabled) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const fileArray = Array.from(files);
      const newImages = [];
      
      for (const file of fileArray) {
        validateFile(file);
        
        const base64 = await fileToBase64(file);
        const newImage = {
          id: generateImageId(),
          filename: file.name,
          data: base64,
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString()
        };
        
        newImages.push(newImage);
      }
      
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      
      // Insert image placeholders into text
      const imagePlaceholders = newImages.map(img => `[IMG:${img.id}]`).join(' ');
      const newValue = value + (value ? '\n' : '') + imagePlaceholders;
      onChange(newValue);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle paste
  const handlePaste = useCallback((e) => {
    if (disabled) return;
    
    const items = e.clipboardData.items;
    const files = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        files.push(item.getAsFile());
      }
    }
    
    if (files.length > 0) {
      e.preventDefault();
      processFiles(files);
    }
  }, [disabled, processFiles]);

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  // Delete image
  const handleDeleteImage = (imageId) => {
    if (disabled) return;
    
    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    
    // Remove image placeholder from text
    const newValue = value.replace(new RegExp(`\\[IMG:${imageId}\\]`, 'g'), '').replace(/\n\s*\n/g, '\n').trim();
    onChange(newValue);
  };

  // Render text with image placeholders
  const renderTextWithImages = (text) => {
    if (!text) return '';
    
    return text.split(/(\[IMG:[^\]]+\])/).map((part, index) => {
      const imgMatch = part.match(/\[IMG:([^\]]+)\]/);
      if (imgMatch) {
        const imageId = imgMatch[1];
        const image = images.find(img => img.id === imageId);
        if (image) {
          return (
            <span key={index} className="inline-block">
              <img 
                src={image.data} 
                alt={image.filename}
                className="max-w-full h-auto max-h-32 rounded border border-gray-200"
              />
            </span>
          );
        }
      }
      return part;
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-none ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        
        {/* Upload indicator */}
        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-primary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Procesando imágenes...</span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ImageIcon size={12} />
            <span>Imágenes adjuntas ({images.length}/{maxImages})</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group bg-white border border-gray-200 rounded overflow-hidden"
              >
                <img
                  src={image.data}
                  alt={image.filename}
                  className="w-full h-16 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!disabled && (
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="p-1 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                        title="Eliminar imagen"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-1">
                  <div className="text-xs text-gray-600 truncate" title={image.filename}>
                    {image.filename}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatFileSize(image.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!disabled && (
        <div className="text-xs text-gray-400">
          💡 Puedes pegar imágenes con Ctrl+V / Cmd+V o arrastrarlas aquí
        </div>
      )}
    </div>
  );
}
