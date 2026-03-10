import type { T } from '@deltachat/jsonrpc-client'

export const GALLERY_TAB_ORDER = [
  'recent',
  'images',
  'video',
  'audio',
  'files',
  'webxdc_apps',
] as const

export type MediaTabKey = (typeof GALLERY_TAB_ORDER)[number]

export const RECENT_MEDIA_LIMIT_PER_TYPE = 200

export const RECENT_MEDIA_REQUESTS: ReadonlyArray<
  readonly [T.Viewtype, T.Viewtype?]
> = [
  ['Gif', 'Image'],
  ['Video'],
  ['Audio', 'Voice'],
  ['File'],
  ['Webxdc'],
]

export function getRecentTypeLabelKey(
  viewType: T.Viewtype
): 'images' | 'video' | 'audio' | 'files' | 'webxdc_apps' {
  switch (viewType) {
    case 'Gif':
    case 'Image':
      return 'images'
    case 'Video':
      return 'video'
    case 'Audio':
    case 'Voice':
      return 'audio'
    case 'Webxdc':
      return 'webxdc_apps'
    default:
      return 'files'
  }
}

export function getRecentOpenBehavior(
  viewType: T.Viewtype
): 'fullscreen' | 'webxdc' | 'shell' {
  switch (viewType) {
    case 'Gif':
    case 'Image':
    case 'Video':
      return 'fullscreen'
    case 'Webxdc':
      return 'webxdc'
    default:
      return 'shell'
  }
}

export function getRecentPreviewKind(
  viewType: T.Viewtype
): 'media' | 'webxdc' | 'file' {
  switch (viewType) {
    case 'Gif':
    case 'Image':
    case 'Video':
      return 'media'
    case 'Webxdc':
      return 'webxdc'
    default:
      return 'file'
  }
}

function getMessageTimestamp(result: T.MessageLoadResult | undefined): number {
  return result?.kind === 'message' ? result.timestamp : Number.MIN_SAFE_INTEGER
}

export function getSortedRecentMediaIds(
  groupedMediaIds: ReadonlyArray<ReadonlyArray<number>>,
  mediaLoadResult: Record<number, T.MessageLoadResult>
): number[] {
  const uniqueIds = [...new Set(groupedMediaIds.flat())]

  uniqueIds.sort((left, right) => {
    const timestampDiff =
      getMessageTimestamp(mediaLoadResult[right]) -
      getMessageTimestamp(mediaLoadResult[left])
    if (timestampDiff !== 0) {
      return timestampDiff
    }

    return right - left
  })

  return uniqueIds
}
