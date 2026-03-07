const BLOCK_LEVEL_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'div',
  'dl',
  'dt',
  'dd',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'thead',
  'tfoot',
  'tr',
  'ul',
])

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'template'])

const SIMPLE_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

export function htmlToMessageText(html: string): string {
  const byDomParser = htmlToMessageTextWithDomParser(html)
  if (byDomParser !== null) {
    return byDomParser
  }

  return htmlToMessageTextFallback(html)
}

function htmlToMessageTextWithDomParser(html: string): string | null {
  if (typeof DOMParser === 'undefined') {
    return null
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const chunks: string[] = []

    for (const childNode of Array.from(doc.body.childNodes)) {
      collectNodeText(childNode, chunks)
    }

    return normalizeExtractedText(chunks.join(''))
  } catch {
    return null
  }
}

function collectNodeText(node: Node, chunks: string[]) {
  if (node.nodeType === 3) {
    chunks.push((node as Text).data)
    return
  }

  if (node.nodeType !== 1) {
    return
  }

  const element = node as HTMLElement
  const tagName = element.tagName.toLowerCase()

  if (SKIP_TAGS.has(tagName)) {
    return
  }

  if (tagName === 'br') {
    chunks.push('\n')
    return
  }

  if (tagName === 'li') {
    chunks.push('\n- ')
  } else if (BLOCK_LEVEL_TAGS.has(tagName)) {
    chunks.push('\n')
  }

  for (const childNode of Array.from(element.childNodes)) {
    collectNodeText(childNode, chunks)
  }

  if (tagName !== 'li' && BLOCK_LEVEL_TAGS.has(tagName)) {
    chunks.push('\n')
  }
}

function htmlToMessageTextFallback(html: string): string {
  const withoutSkippedTags = html.replace(
    /<\s*(script|style|noscript|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    ''
  )

  const withExtractedText = withoutSkippedTags.replace(/<[^>]*>/g, tag => {
    const tagNameMatch = tag.match(/^<\s*\/?\s*([a-zA-Z0-9]+)/)
    if (!tagNameMatch) {
      return ''
    }

    const tagName = tagNameMatch[1].toLowerCase()
    const isClosingTag = /^<\s*\//.test(tag)

    if (tagName === 'br') {
      return '\n'
    }

    if (tagName === 'li') {
      return isClosingTag ? '' : '\n- '
    }

    return BLOCK_LEVEL_TAGS.has(tagName) ? '\n' : ''
  })

  return normalizeExtractedText(decodeHtmlEntities(withExtractedText))
}

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (raw, entity) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      return decodeNumericEntity(raw, entity.slice(2), 16)
    }

    if (entity.startsWith('#')) {
      return decodeNumericEntity(raw, entity.slice(1), 10)
    }

    const mapped = SIMPLE_ENTITY_MAP[entity.toLowerCase()]
    return mapped ?? raw
  })
}

function decodeNumericEntity(
  raw: string,
  codePointLiteral: string,
  radix: 10 | 16
): string {
  const codePoint = Number.parseInt(codePointLiteral, radix)
  if (
    !Number.isSafeInteger(codePoint) ||
    codePoint < 0 ||
    codePoint > 0x10ffff
  ) {
    return raw
  }

  try {
    return String.fromCodePoint(codePoint)
  } catch {
    return raw
  }
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v\u00a0]+/g, ' ')
    .replace(/[ \t\u00a0]*\n[ \t\u00a0]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
