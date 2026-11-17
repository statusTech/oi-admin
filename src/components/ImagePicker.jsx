import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/**
 * `image` pode ser uma URL (string), um File recém-escolhido ou null.
 * `setImage` recebe File | null.
 */
const ImagePicker = ({ label = '', name, image, setImage }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(typeof image === 'string' ? image : null);

  useEffect(() => {
    if (typeof image === 'string') {
      setPreview(image || null);
      return undefined;
    }
    if (!image) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleFileLoad = (e) => {
    const photo = e.target.files?.[0];
    if (photo) setImage(photo);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-1.5 h-full">
      <Label>{label}</Label>
      <div className="flex-1 min-h-[120px] rounded-md border border-dashed border-oi-border bg-oi-bg flex items-center justify-center overflow-hidden p-2">
        {preview ? (
          <img src={preview} alt={label} className="max-h-32 w-full object-contain" />
        ) : (
          <ImagePlus className="h-8 w-8 text-oi-light-gray" strokeWidth={1.5} />
        )}
      </div>
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept="image/png, image/jpg, image/jpeg"
        className="hidden"
        onChange={handleFileLoad}
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          {preview ? <Pencil className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
          {preview ? 'Trocar' : 'Selecionar'}
        </Button>
        {preview && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setImage(null)}
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImagePicker;
