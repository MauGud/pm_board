import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  FileSpreadsheet
} from 'lucide-react';

export default function ImageAttachments({ 
  images = [], 
  onUpdateImages, 
  disabled = false,
  maxImages = 10,
  maxSizeMB = 5
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

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
      throw new Error(`Máximo ${maxImages} imágenes por user story.`);
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
      onUpdateImages(updatedImages);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

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

  // Delete image
  const handleDeleteImage = (imageId) => {
    if (disabled) return;
    
    const updatedImages = images.filter(img => img.id !== imageId);
    onUpdateImages(updatedImages);
    
    // Close preview if deleting the previewed image
    if (previewImage && previewImage.id === imageId) {
      setPreviewImage(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file extension
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  // Get file icon based on type
  const getFileIcon = (fileType, filename) => {
    const extension = getFileExtension(filename).toLowerCase();
    
    if (fileType.startsWith('image/')) {
      return <FileImage size={16} className="text-blue-600" />;
    } else if (fileType === 'application/pdf' || extension === 'pdf') {
      return <FileText size={16} className="text-red-600" />;
    } else if (fileType.includes('spreadsheet') || extension === 'xlsx' || extension === 'xls') {
      return <FileSpreadsheet size={16} className="text-green-600" />;
    } else if (fileType.includes('video/')) {
      return <FileVideo size={16} className="text-purple-600" />;
    } else if (fileType.includes('audio/')) {
      return <FileAudio size={16} className="text-orange-600" />;
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
      return <Archive size={16} className="text-gray-600" />;
    } else {
      return <FileText size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          📄 Documentos
          {images.length > 0 && (
            <span className="text-xs text-gray-500">
              ({images.length}/{maxImages})
            </span>
          )}
        </h4>
        {!disabled && images.length < maxImages && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-purple-50 rounded transition-colors"
            title="Subir imágenes"
          >
            <Upload size={14} />
            Subir
          </button>
        )}
      </div>

      {/* Upload area */}
      {!disabled && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
            dragOver
              ? 'border-primary bg-purple-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={handleFileInput}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-primary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Procesando imágenes...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-sm text-gray-600">
                <p>Arrastra documentos aquí o haz clic para seleccionar</p>
                <p className="text-xs text-gray-400 mt-1">
                  También puedes pegar imágenes con Ctrl+V / Cmd+V
                </p>
                <p className="text-xs text-gray-400">
                  Máximo {maxSizeMB}MB por archivo • {maxImages - images.length} espacios disponibles
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Documents grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
            >
              {/* Document preview */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {image.type.startsWith('image/') ? (
                  <img
                    src={image.data}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    {getFileIcon(image.type, image.filename)}
                    <span className="text-xs mt-1">{getFileExtension(image.filename)}</span>
                  </div>
                )}
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                  {image.type.startsWith('image/') && (
                    <button
                      onClick={() => setPreviewImage(image)}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                      title="Ver documento completo"
                    >
                      <Eye size={16} className="text-gray-700" />
                    </button>
                  )}
                  {!disabled && (
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-2 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                      title="Eliminar documento"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Document info */}
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 truncate flex-1" title={image.filename}>
                    {image.filename}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {getFileExtension(image.filename)}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {formatFileSize(image.size)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>No hay imágenes adjuntas</p>
          {!disabled && (
            <p className="text-xs mt-1">Arrastra imágenes o haz clic en "Subir"</p>
          )}
        </div>
      )}

      {/* Image preview modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage.data}
              alt={previewImage.filename}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3 rounded-b-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{previewImage.filename}</span>
                <span className="text-xs text-gray-300">
                  {formatFileSize(previewImage.size)} • {getFileExtension(previewImage.filename)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!disabled && images.length > 0 && (
        <div className="text-xs text-gray-400">
          💡 Haz clic en una imagen para verla completa • Hover para ver opciones
        </div>
      )}
    </div>
  );
}
