/** 触发浏览器下载 blob 文件 */
export function downloadBlob(blob: Blob, fallbackName: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fallbackName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/** 从 Content-Disposition 头解析文件名 */
export function parseFilenameFromDisposition(disposition?: string, fallback = 'download'): string {
  if (!disposition) return fallback
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  if (match) {
    try {
      return decodeURIComponent(match[1].replace(/"/g, ''))
    } catch {
      return match[1].replace(/"/g, '')
    }
  }
  return fallback
}
