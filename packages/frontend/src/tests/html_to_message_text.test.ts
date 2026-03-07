import { expect } from 'chai'
import { describe, it } from 'mocha'

import { htmlToMessageText } from '../components/message/htmlToMessageText.js'

describe('htmlToMessageText', () => {
  it('strips unsafe tags and preserves readable structure', () => {
    const html =
      '<html><head><style>.x { color: red }</style></head><body>' +
      '<p>Hello <b>World</b> &amp; friends</p>' +
      "<script>alert('xss')</script>" +
      '<p>Second line<br>with break</p>' +
      '<ul><li>Item A</li><li>Item B</li></ul>' +
      '</body></html>'

    expect(htmlToMessageText(html)).to.equal(
      'Hello World & friends\n\nSecond line\nwith break\n\n- Item A\n- Item B'
    )
  })

  it('decodes named and numeric entities', () => {
    expect(
      htmlToMessageText('&lt;tag&gt; &#x1F680; &#128512; &nbsp; &quot;quoted&quot;')
    ).to.equal('<tag> 🚀 😀 "quoted"')
  })

  it('collapses excessive blank lines', () => {
    expect(htmlToMessageText('<div>One</div><div></div><div>Two</div>')).to.equal(
      'One\n\nTwo'
    )
  })

  it('keeps invalid numeric entities as-is', () => {
    expect(htmlToMessageText('Bad: &#999999999999; &#x110000;')).to.equal(
      'Bad: &#999999999999; &#x110000;'
    )
  })

  it('uses DOMParser branch when available', () => {
    const previousDomParser = (globalThis as any).DOMParser
    let parseCalled = false

    const textNode = (data: string) => ({
      nodeType: 3,
      data,
    })
    const elementNode = (tagName: string, childNodes: Array<any> = []) => ({
      nodeType: 1,
      tagName,
      childNodes,
    })

    class MockDOMParser {
      parseFromString(input: string, kind: string) {
        parseCalled = true
        expect(input).to.equal('<ignored/>')
        expect(kind).to.equal('text/html')
        return {
          body: {
            childNodes: [
              elementNode('P', [textNode('Line 1')]),
              elementNode('SCRIPT', [textNode('ignore me')]),
              elementNode('UL', [elementNode('LI', [textNode('Item')])]),
              elementNode('P', [textNode('Line 2')]),
            ],
          },
        }
      }
    }

    ;(globalThis as any).DOMParser = MockDOMParser

    try {
      expect(htmlToMessageText('<ignored/>')).to.equal(
        'Line 1\n\n- Item\n\nLine 2'
      )
      expect(parseCalled).to.equal(true)
    } finally {
      ;(globalThis as any).DOMParser = previousDomParser
    }
  })
})
