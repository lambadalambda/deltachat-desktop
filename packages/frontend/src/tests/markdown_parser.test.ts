import { expect } from 'chai'
import { describe, it } from 'mocha'

import { parseMarkdown } from '../utils/markdown/parseMarkdown.js'

describe('markdown parser', () => {
  it('parses basic inline formatting', () => {
    const elements = parseMarkdown('Hello *bold* _italic_ ~strike~')

    expect(elements).to.deep.equal([
      { t: 'text', c: 'Hello ' },
      { t: 'bold', c: [{ t: 'text', c: 'bold' }] },
      { t: 'text', c: ' ' },
      { t: 'italic', c: [{ t: 'text', c: 'italic' }] },
      { t: 'text', c: ' ' },
      { t: 'strike', c: [{ t: 'text', c: 'strike' }] },
    ])
  })

  it('parses markdown links with formatted labels', () => {
    const elements = parseMarkdown('[**docs**](https://example.org/docs)')

    expect(elements).to.deep.equal([
      {
        t: 'markdown_link',
        c: {
          target: 'https://example.org/docs',
          label: [{ t: 'bold', c: [{ t: 'text', c: 'docs' }] }],
        },
      },
    ])
  })

  it('parses code blocks and inline code', () => {
    const elements = parseMarkdown('Inline `code`\n```ts\nconst x = 1\n```')

    expect(elements).to.deep.equal([
      { t: 'text', c: 'Inline ' },
      { t: 'inline_code', c: 'code' },
      { t: 'text', c: '\n' },
      {
        t: 'code_block',
        c: {
          language: 'ts',
          content: 'const x = 1\n',
        },
      },
    ])
  })

  it('keeps escaped markdown characters as plain text', () => {
    const elements = parseMarkdown('\\*nope\\* \\_still plain\\_')
    expect(elements).to.deep.equal([{ t: 'text', c: '*nope* _still plain_' }])
  })

  it('supports markdown links with parentheses in the destination', () => {
    const elements = parseMarkdown(
      '[with parens](https://example.org/path(test))'
    )

    expect(elements).to.deep.equal([
      {
        t: 'markdown_link',
        c: {
          target: 'https://example.org/path(test)',
          label: [{ t: 'text', c: 'with parens' }],
        },
      },
    ])
  })
})
