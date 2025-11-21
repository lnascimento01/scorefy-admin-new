export function downloadBase64File(base64: string, filename: string, mime = 'application/octet-stream') {
  if (!base64) return
  const dataUrl = `data:${mime};base64,${base64}`
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
