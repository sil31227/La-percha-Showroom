export function compressImage(file: File, maxSize: number, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height / width) * maxSize)
          width = maxSize
        } else {
          width = Math.round((width / height) * maxSize)
          height = maxSize
        }
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("No se pudo crear el canvas")); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error("No se pudo comprimir la imagen")); return }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })
          resolve(compressed)
        },
        "image/jpeg",
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo cargar la imagen")) }
    img.src = url
  })
}
