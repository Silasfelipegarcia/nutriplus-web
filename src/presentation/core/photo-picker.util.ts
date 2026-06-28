const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_EDGE_PX = 1920;
const JPEG_QUALITY = 0.82;

export class PhotoPickerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoPickerError';
  }
}

export function pickImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null);
    });
    input.click();
  });
}

export async function fileToPhotoDataUrl(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new PhotoPickerError('Use uma imagem JPEG, PNG ou WebP.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new PhotoPickerError('Não foi possível processar a imagem.');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const mime = file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const dataUrl =
      mime === 'image/jpeg'
        ? canvas.toDataURL('image/jpeg', JPEG_QUALITY)
        : canvas.toDataURL(mime);

    if (dataUrl.length > 4_000_000) {
      throw new PhotoPickerError('A imagem é grande demais. Escolha outra foto.');
    }

    return dataUrl;
  } finally {
    bitmap.close();
  }
}
