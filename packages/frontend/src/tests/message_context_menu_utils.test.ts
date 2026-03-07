import { expect } from 'chai'
import { describe, it } from 'mocha'

import { shouldShowCopyItem } from '../components/message/messageContextMenuUtils.js'

describe('messageContextMenuUtils', () => {
  describe('shouldShowCopyItem', () => {
    it('hides copy item when there is no selection, no email and no text', () => {
      expect(shouldShowCopyItem(undefined, false, null)).to.equal(false)
      expect(shouldShowCopyItem('', false, null)).to.equal(false)
    })

    it('shows copy item when message text is present', () => {
      expect(shouldShowCopyItem('hello', false, null)).to.equal(true)
    })

    it('shows copy item for selection and email even without message text', () => {
      expect(shouldShowCopyItem(undefined, true, null)).to.equal(true)
      expect(shouldShowCopyItem('', false, 'user@example.org')).to.equal(true)
    })
  })
})
