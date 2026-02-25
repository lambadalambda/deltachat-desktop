import { expect } from 'chai'
import { describe, it } from 'mocha'

import {
  buildReactionPayload,
  canShowQuickReactButton,
} from '../components/Reactions/reactionHelpers.js'

describe('reactionHelpers', () => {
  describe('buildReactionPayload', () => {
    it('returns a new reaction in set mode', () => {
      expect(buildReactionPayload(undefined, '👍', 'set')).to.deep.equal(['👍'])
      expect(buildReactionPayload('😂', '👍', 'set')).to.deep.equal(['👍'])
    })

    it('toggles off when selecting same emoji in toggle mode', () => {
      expect(buildReactionPayload('👍', '👍', 'toggle')).to.deep.equal([])
    })

    it('switches reaction when selecting another emoji in toggle mode', () => {
      expect(buildReactionPayload('😂', '👍', 'toggle')).to.deep.equal(['👍'])
      expect(buildReactionPayload(undefined, '👍', 'toggle')).to.deep.equal([
        '👍',
      ])
    })
  })

  describe('canShowQuickReactButton', () => {
    it('shows quick react only when reactions can be sent and reaction is not from self', () => {
      expect(canShowQuickReactButton(true, false)).to.equal(true)
      expect(canShowQuickReactButton(true, true)).to.equal(false)
      expect(canShowQuickReactButton(false, false)).to.equal(false)
    })
  })
})
