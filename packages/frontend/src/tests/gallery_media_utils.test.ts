import { expect } from 'chai'
import { describe, it } from 'mocha'

import {
  GALLERY_TAB_ORDER,
  getRecentOpenBehavior,
  getRecentPreviewKind,
  getRecentTypeLabelKey,
  getSortedRecentMediaIds,
  RECENT_MEDIA_LIMIT_PER_TYPE,
} from '../components/galleryMediaUtils.js'

describe('galleryMediaUtils', () => {
  it('uses the expected gallery tab order', () => {
    expect(GALLERY_TAB_ORDER).to.deep.equal([
      'recent',
      'images',
      'video',
      'audio',
      'files',
      'webxdc_apps',
    ])
  })

  it('uses a bounded per-type recent media limit', () => {
    expect(RECENT_MEDIA_LIMIT_PER_TYPE).to.equal(200)
  })

  it('deduplicates and sorts recent ids by message timestamp', () => {
    const groupedMediaIds = [
      [2, 1],
      [4, 1],
      [3],
    ]
    const mediaLoadResult = {
      1: { kind: 'message', timestamp: 100 } as any,
      2: { kind: 'message', timestamp: 200 } as any,
      3: { kind: 'message', timestamp: 50 } as any,
      4: { kind: 'message', timestamp: 175 } as any,
    }

    expect(getSortedRecentMediaIds(groupedMediaIds, mediaLoadResult)).to.deep
      .equal([2, 4, 1, 3])
  })

  it('falls back to message id when timestamps are equal', () => {
    const groupedMediaIds = [[1, 3, 2]]
    const mediaLoadResult = {
      1: { kind: 'message', timestamp: 100 } as any,
      2: { kind: 'message', timestamp: 100 } as any,
      3: { kind: 'message', timestamp: 100 } as any,
    }

    expect(getSortedRecentMediaIds(groupedMediaIds, mediaLoadResult)).to.deep
      .equal([3, 2, 1])
  })

  it('pushes loading errors and missing ids to the end', () => {
    const groupedMediaIds = [[20, 10, 15]]
    const mediaLoadResult = {
      10: { kind: 'message', timestamp: 100 } as any,
      15: { kind: 'loadingError', error: 'broken fixture message' } as any,
    }

    expect(getSortedRecentMediaIds(groupedMediaIds, mediaLoadResult)).to.deep
      .equal([10, 20, 15])
  })

  it('maps recent view types to tab label keys', () => {
    expect(getRecentTypeLabelKey('Image')).to.equal('images')
    expect(getRecentTypeLabelKey('Gif')).to.equal('images')
    expect(getRecentTypeLabelKey('Video')).to.equal('video')
    expect(getRecentTypeLabelKey('Audio')).to.equal('audio')
    expect(getRecentTypeLabelKey('Voice')).to.equal('audio')
    expect(getRecentTypeLabelKey('Webxdc')).to.equal('webxdc_apps')
    expect(getRecentTypeLabelKey('File')).to.equal('files')
  })

  it('maps recent view types to open behaviors', () => {
    expect(getRecentOpenBehavior('Image')).to.equal('fullscreen')
    expect(getRecentOpenBehavior('Gif')).to.equal('fullscreen')
    expect(getRecentOpenBehavior('Video')).to.equal('fullscreen')
    expect(getRecentOpenBehavior('Webxdc')).to.equal('webxdc')
    expect(getRecentOpenBehavior('Audio')).to.equal('shell')
    expect(getRecentOpenBehavior('Voice')).to.equal('shell')
    expect(getRecentOpenBehavior('File')).to.equal('shell')
  })

  it('maps recent view types to preview kinds', () => {
    expect(getRecentPreviewKind('Image')).to.equal('media')
    expect(getRecentPreviewKind('Gif')).to.equal('media')
    expect(getRecentPreviewKind('Video')).to.equal('media')
    expect(getRecentPreviewKind('Webxdc')).to.equal('webxdc')
    expect(getRecentPreviewKind('Audio')).to.equal('file')
    expect(getRecentPreviewKind('Voice')).to.equal('file')
    expect(getRecentPreviewKind('File')).to.equal('file')
  })
})
