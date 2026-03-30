function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Nao foi possivel ler a imagem selecionada."));
    };

    image.src = imageUrl;
  });
}

export async function fileToOptimizedDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem valido.");
  }

  const maxSizeInBytes = 8 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    throw new Error("A imagem deve ter no maximo 8MB.");
  }

  const image = await loadImageFromFile(file);

  const maxDimension = 720;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Nao foi possivel processar a imagem.");
  }

  context.drawImage(image, 0, 0, width, height);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const quality = outputType === "image/jpeg" ? 0.82 : undefined;

  const dataUrl = canvas.toDataURL(outputType, quality);
  return dataUrl;
}
