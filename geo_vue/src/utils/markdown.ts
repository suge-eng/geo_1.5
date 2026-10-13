function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(s: string): string {
  let t = escapeHtml(s)
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>')
  t = t.replace(/`(.+?)`/g, '<code>$1</code>')
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, url: string) => {
    const safe = /^https?:\/\//i.test(url) ? url : '#'
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`
  })
  return t
}

/** HTML 实体解码（命名 + 数字实体） */
function decodeEntities(s: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' '
  }
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isNaN(code) ? m : String.fromCodePoint(code)
    }
    return named[e] ?? m
  })
}

/** 是否含 HTML 标签（AI 平台返回的富文本，而非 Markdown / 纯文本） */
function looksLikeHtml(s: string): boolean {
  return /<(div|span|a|p|li|ul|ol|svg|br|section|article|blockquote|h[1-6]|table|strong|em|b|i)\b/i.test(s)
}

/** HTML → 可读文本（保留换行与链接、加粗/斜体），供 AI 富文本降级展示 */
function htmlToText(html: string): string {
  let s = html
    // 去掉脚本/样式/矢量图标/头部
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')

  // 链接优先：转为 [文本](url)，内部标签以空格替换
  s = s.replace(
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, url: string, text: string) => {
      const t = text.replace(/<\/?[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      return t ? `[${t}](${url})` : url
    }
  )

  // 加粗/斜体 → Markdown 标记
  s = s
    .replace(/<\/(strong|b)>/gi, '**')
    .replace(/<(strong|b)\b[^>]*>/gi, '**')
    .replace(/<\/(em|i)>/gi, '*')
    .replace(/<(em|i)\b[^>]*>/gi, '*')

  // 块级边界 → 换行；列表项 → 短横线
  s = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/(div|p|li|ul|ol|h[1-6]|blockquote|pre|tr|section|article|table)>/gi, '\n')
    .replace(/<(div|p|h[1-6]|blockquote|pre|tr|section|article|table)\b[^>]*>/gi, '\n')
    .replace(/<\/?(ul|ol)\b[^>]*>/gi, '\n')

  // 其余标签全部剥离
  s = s.replace(/<[^>]+>/g, '')
  // 解码实体 + 规整空白
  s = decodeEntities(s)
  s = s.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return s
}

/** 轻量安全渲染：自动识别 Markdown / HTML 富文本（先转义后格式化，防注入） */
export function renderMarkdown(src?: string | null): string {
  if (!src) return ''
  const raw = String(src).replace(/\r\n?/g, '\n')
  const text = looksLikeHtml(raw) ? htmlToText(raw) : raw
  const out: string[] = []
  let inList = false
  const flushList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (const line of text.split('\n')) {
    const t = line.trim()
    const heading = t.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushList()
      out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`)
      continue
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      flushList()
      out.push('<hr/>')
      continue
    }
    const ul = t.match(/^[-*+]\s+(.*)$/)
    if (ul) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(ul[1])}</li>`)
      continue
    }
    const ol = t.match(/^\d+[.、)]\s+(.*)$/)
    if (ol) {
      flushList()
      out.push(`<ol><li>${inline(ol[1])}</li></ol>`)
      continue
    }
    if (!t) {
      flushList()
      continue
    }
    flushList()
    out.push(`<p>${inline(t)}</p>`)
  }
  flushList()
  return out.join('')
}
