type MessageMarkdownText = {
  t: 'text'
  c: string
}

type MessageMarkdownInlineCode = {
  t: 'inline_code'
  c: string
}

type MessageMarkdownCodeBlock = {
  t: 'code_block'
  c: {
    content: string
    language: string
  }
}

type MessageMarkdownLink = {
  t: 'markdown_link'
  c: {
    target: string
    label: MessageMarkdownElement[]
  }
}

type MessageMarkdownFormatted = {
  t: 'bold' | 'italic' | 'strike'
  c: MessageMarkdownElement[]
}

export type MessageMarkdownElement =
  | MessageMarkdownText
  | MessageMarkdownInlineCode
  | MessageMarkdownCodeBlock
  | MessageMarkdownLink
  | MessageMarkdownFormatted

const ESCAPABLE_MARKDOWN_CHARACTERS = new Set([
  '\\',
  '[',
  ']',
  '(',
  ')',
  '*',
  '_',
  '~',
  '`',
])

const SIMPLE_FORMAT_CHARACTERS = new Set(['*', '_', '~'])

export function parseMarkdown(message: string): MessageMarkdownElement[] {
  return mergeTextElements(parseBlocks(message))
}

function parseBlocks(message: string): MessageMarkdownElement[] {
  const parts: MessageMarkdownElement[] = []
  let offset = 0

  while (offset < message.length) {
    const blockStart = message.indexOf('```', offset)

    if (blockStart === -1) {
      parts.push(...parseInline(message.slice(offset)))
      break
    }

    if (blockStart > offset) {
      parts.push(...parseInline(message.slice(offset, blockStart)))
    }

    const parsedCodeBlock = tryParseCodeBlock(message, blockStart)
    if (!parsedCodeBlock) {
      parts.push({ t: 'text', c: '```' })
      offset = blockStart + 3
      continue
    }

    parts.push(parsedCodeBlock.element)
    offset = parsedCodeBlock.nextIndex
  }

  return parts
}

function tryParseCodeBlock(
  message: string,
  startIndex: number
):
  | {
      element: MessageMarkdownCodeBlock
      nextIndex: number
    }
  | null {
  if (!message.startsWith('```', startIndex)) {
    return null
  }

  const afterFence = startIndex + 3
  const closingFence = message.indexOf('```', afterFence)

  if (closingFence === -1) {
    return null
  }

  const firstLineBreak = message.indexOf('\n', afterFence)
  const hasLanguageHeader =
    firstLineBreak !== -1 &&
    firstLineBreak < closingFence &&
    firstLineBreak !== afterFence

  const language = hasLanguageHeader
    ? message.slice(afterFence, firstLineBreak).trim()
    : ''

  const contentStart =
    firstLineBreak !== -1 && firstLineBreak < closingFence
      ? firstLineBreak + 1
      : afterFence

  return {
    element: {
      t: 'code_block',
      c: {
        content: message.slice(contentStart, closingFence),
        language,
      },
    },
    nextIndex: closingFence + 3,
  }
}

function parseInline(message: string): MessageMarkdownElement[] {
  const elements: MessageMarkdownElement[] = []
  let plainTextBuffer = ''
  let offset = 0

  const flushPlainTextBuffer = () => {
    if (plainTextBuffer.length === 0) {
      return
    }
    elements.push({ t: 'text', c: plainTextBuffer })
    plainTextBuffer = ''
  }

  while (offset < message.length) {
    const current = message[offset]
    const next = message[offset + 1]

    if (current === '\\' && next && ESCAPABLE_MARKDOWN_CHARACTERS.has(next)) {
      plainTextBuffer += next
      offset += 2
      continue
    }

    if (current === '[') {
      const parsedLink = tryParseMarkdownLink(message, offset)
      if (parsedLink) {
        flushPlainTextBuffer()
        elements.push({
          t: 'markdown_link',
          c: {
            target: parsedLink.target,
            label: parseInline(parsedLink.label),
          },
        })
        offset = parsedLink.nextIndex
        continue
      }
    }

    if (current === '`') {
      const parsedInlineCode = tryParseInlineCode(message, offset)
      if (parsedInlineCode) {
        flushPlainTextBuffer()
        elements.push({
          t: 'inline_code',
          c: parsedInlineCode.content,
        })
        offset = parsedInlineCode.nextIndex
        continue
      }
    }

    if (SIMPLE_FORMAT_CHARACTERS.has(current)) {
      const parsedFormatted = tryParseSimpleFormatting(message, offset)
      if (parsedFormatted) {
        flushPlainTextBuffer()
        elements.push({
          t: parsedFormatted.type,
          c: parseInline(parsedFormatted.content),
        })
        offset = parsedFormatted.nextIndex
        continue
      }
    }

    plainTextBuffer += current
    offset += 1
  }

  flushPlainTextBuffer()

  return mergeTextElements(elements)
}

function tryParseMarkdownLink(
  message: string,
  startIndex: number
):
  | {
      label: string
      target: string
      nextIndex: number
    }
  | null {
  if (message[startIndex] !== '[') {
    return null
  }

  let labelDepth = 1
  let labelEnd = -1

  for (let i = startIndex + 1; i < message.length; i += 1) {
    const current = message[i]

    if (current === '\\') {
      i += 1
      continue
    }

    if (current === '[') {
      labelDepth += 1
      continue
    }

    if (current === ']') {
      labelDepth -= 1
      if (labelDepth === 0) {
        labelEnd = i
        break
      }
    }
  }

  if (labelEnd === -1 || message[labelEnd + 1] !== '(') {
    return null
  }

  let targetDepth = 1
  let targetEnd = -1
  for (let i = labelEnd + 2; i < message.length; i += 1) {
    const current = message[i]

    if (current === '\\') {
      i += 1
      continue
    }

    if (current === '(') {
      targetDepth += 1
      continue
    }

    if (current === ')') {
      targetDepth -= 1
      if (targetDepth === 0) {
        targetEnd = i
        break
      }
    }
  }

  if (targetEnd === -1) {
    return null
  }

  const label = message.slice(startIndex + 1, labelEnd)
  const rawTarget = message.slice(labelEnd + 2, targetEnd).trim()

  if (rawTarget.length === 0) {
    return null
  }

  const target = normalizeLinkTarget(rawTarget)
  if (target.length === 0) {
    return null
  }

  return {
    label,
    target,
    nextIndex: targetEnd + 1,
  }
}

function normalizeLinkTarget(rawTarget: string): string {
  const target =
    rawTarget.startsWith('<') && rawTarget.endsWith('>')
      ? rawTarget.slice(1, -1)
      : rawTarget

  return target.replace(/\\([\\()[\]])/g, '$1')
}

function tryParseInlineCode(
  message: string,
  startIndex: number
):
  | {
      content: string
      nextIndex: number
    }
  | null {
  if (message[startIndex] !== '`') {
    return null
  }

  let markerLength = 1
  while (message[startIndex + markerLength] === '`') {
    markerLength += 1
  }

  const marker = '`'.repeat(markerLength)
  const searchStart = startIndex + markerLength
  const closingIndex = message.indexOf(marker, searchStart)

  if (closingIndex === -1 || closingIndex === searchStart) {
    return null
  }

  return {
    content: message.slice(searchStart, closingIndex),
    nextIndex: closingIndex + markerLength,
  }
}

function tryParseSimpleFormatting(
  message: string,
  startIndex: number
):
  | {
      type: MessageMarkdownFormatted['t']
      content: string
      nextIndex: number
    }
  | null {
  const marker = message[startIndex]
  if (!SIMPLE_FORMAT_CHARACTERS.has(marker)) {
    return null
  }

  const markerLength = message[startIndex + 1] === marker ? 2 : 1
  const markerString = marker.repeat(markerLength)
  const previous = message[startIndex - 1]
  const afterOpeningMarker = message[startIndex + markerLength]

  if (
    !afterOpeningMarker ||
    isWhitespace(afterOpeningMarker) ||
    !isBoundaryCharacter(previous)
  ) {
    return null
  }

  const type =
    marker === '*' ? 'bold' : marker === '_' ? 'italic' : ('strike' as const)

  for (
    let closingIndex = startIndex + markerLength;
    closingIndex < message.length;
    closingIndex += 1
  ) {
    const current = message[closingIndex]
    if (current === '\\') {
      closingIndex += 1
      continue
    }

    if (!message.startsWith(markerString, closingIndex)) {
      continue
    }

    const beforeClosingMarker = message[closingIndex - 1]
    const afterClosingMarker = message[closingIndex + markerLength]

    if (
      !beforeClosingMarker ||
      isWhitespace(beforeClosingMarker) ||
      !isBoundaryCharacter(afterClosingMarker)
    ) {
      continue
    }

    const content = message.slice(
      startIndex + markerLength,
      closingIndex
    )

    if (content.trim().length === 0) {
      continue
    }

    return {
      type,
      content,
      nextIndex: closingIndex + markerLength,
    }
  }

  return null
}

function isWhitespace(value: string | undefined): boolean {
  if (!value) {
    return false
  }
  return /\s/.test(value)
}

function isBoundaryCharacter(value: string | undefined): boolean {
  if (!value) {
    return true
  }
  return !/[\p{L}\p{N}]/u.test(value)
}

function mergeTextElements(
  elements: MessageMarkdownElement[]
): MessageMarkdownElement[] {
  const merged: MessageMarkdownElement[] = []

  for (const element of elements) {
    if (
      element.t === 'text' &&
      merged.length > 0 &&
      merged[merged.length - 1].t === 'text'
    ) {
      const last = merged[merged.length - 1] as MessageMarkdownText
      last.c += element.c
      continue
    }
    merged.push(element)
  }

  return merged
}
