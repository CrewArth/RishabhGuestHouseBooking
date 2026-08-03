export const readAndCompressImageAsDataUrl = (file, options = {}) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file."));
      return;
    }

    const maxWidth = options.maxWidth || 640;
    const maxHeight = options.maxHeight || 220;
    const quality = options.quality || 0.82;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/png", quality));
      };
      img.onerror = () => reject(new Error("Unable to read selected image."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Unable to read selected image."));
    reader.readAsDataURL(file);
  });
