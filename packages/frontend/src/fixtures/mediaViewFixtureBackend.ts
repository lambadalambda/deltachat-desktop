import type { BaseDeltaChat, T } from '@deltachat/jsonrpc-client'

export const FIXTURE_ACCOUNT_ID = 1
export const FIXTURE_CHAT_ID = 7001

export type FixtureDensity = 'normal' | 'busy'

type FixtureMessage = {
  id: number
  chatId: number
  viewType: T.Viewtype
  timestamp: number
  file: string | null
  fileMime: string | null
  fileName: string | null
  fileBytes: number | null
  overrideSenderName: string | null
  sender: { displayName: string }
}

type FixtureWebxdcInfo = {
  name: string
  summary: string
  document: string | null
}

type FixtureState = {
  messages: Map<number, FixtureMessage>
  webxdcInfoById: Map<number, FixtureWebxdcInfo>
}

type EventCallback = (...args: any[]) => void

type EventEmitter = {
  on(eventType: string, callback: EventCallback): void
  off(eventType: string, callback: EventCallback): void
  emit(eventType: string, ...args: any[]): void
}

function createEmitter(): EventEmitter {
  const listeners = new Map<string, Set<EventCallback>>()

  return {
    on(eventType, callback) {
      if (!listeners.has(eventType)) {
        listeners.set(eventType, new Set())
      }
      listeners.get(eventType)?.add(callback)
    },
    off(eventType, callback) {
      listeners.get(eventType)?.delete(callback)
    },
    emit(eventType, ...args) {
      listeners.get(eventType)?.forEach(listener => listener(...args))
      listeners.get('ALL')?.forEach(listener => listener(...args))
    },
  }
}

function createMessage(
  id: number,
  viewType: T.Viewtype,
  timestamp: number,
  partial: Partial<FixtureMessage> = {}
): FixtureMessage {
  const extension =
    partial.fileName?.split('.').pop() ||
    (viewType === 'Webxdc' ? 'xdc' : viewType.toLowerCase())

  return {
    id,
    chatId: FIXTURE_CHAT_ID,
    viewType,
    timestamp,
    file: partial.file ?? `/blobs/${FIXTURE_ACCOUNT_ID}/fixture-${id}.${extension}`,
    fileMime: partial.fileMime ?? null,
    fileName: partial.fileName ?? `fixture-${id}.${extension}`,
    fileBytes: partial.fileBytes ?? 420_000,
    overrideSenderName: partial.overrideSenderName ?? null,
    sender: partial.sender ?? { displayName: 'Fixture Bot' },
  }
}

function cloneWithOffset(
  baseMessages: FixtureMessage[],
  startId: number,
  count: number,
  secondsOffset: number
): FixtureMessage[] {
  const duplicates: FixtureMessage[] = []

  for (let index = 0; index < count; index += 1) {
    const base = baseMessages[index % baseMessages.length]
    const newId = startId + index
    const extension = base.fileName?.split('.').pop() || 'dat'
    const fileStem = (base.fileName || `fixture-${base.id}`).replace(
      /\.[^.]+$/,
      ''
    )

    duplicates.push({
      ...base,
      id: newId,
      timestamp: base.timestamp - secondsOffset * (index + 1),
      fileName: `${fileStem}-${index + 1}.${extension}`,
      file: `/blobs/${FIXTURE_ACCOUNT_ID}/fixture-${newId}.${extension}`,
      fileBytes: (base.fileBytes || 100_000) + index * 17,
    })
  }

  return duplicates
}

function buildBaseState(): FixtureState {
  const images = [
    createMessage(1001, 'Image', 1_731_609_600, {
      file: '/images/intro1.png',
      fileName: 'trip-mountain.jpg',
      fileMime: 'image/jpeg',
      fileBytes: 1_900_000,
      sender: { displayName: 'Alex' },
    }),
    createMessage(1002, 'Gif', 1_731_523_200, {
      file: '/images/deltachat.png',
      fileName: 'cat-wave.gif',
      fileMime: 'image/gif',
      fileBytes: 460_000,
      sender: { displayName: 'Sam' },
    }),
  ]

  const videos = [
    createMessage(2001, 'Video', 1_731_588_000, {
      file: '/fixtures/preview.mp4',
      fileName: 'meeting-summary.mp4',
      fileMime: 'video/mp4',
      fileBytes: 14_200_000,
      sender: { displayName: 'Taylor' },
    }),
  ]

  const audios = [
    createMessage(3001, 'Voice', 1_731_579_000, {
      fileName: 'voice-note.opus',
      fileMime: 'audio/ogg',
      fileBytes: 213_000,
      sender: { displayName: 'Alex' },
    }),
    createMessage(3002, 'Audio', 1_731_500_000, {
      fileName: 'podcast-clip.mp3',
      fileMime: 'audio/mpeg',
      fileBytes: 2_600_000,
      sender: { displayName: 'Sam' },
    }),
  ]

  const files = [
    createMessage(4001, 'File', 1_731_596_400, {
      fileName: 'roadmap-q4.pdf',
      fileMime: 'application/pdf',
      fileBytes: 612_000,
      sender: { displayName: 'Casey' },
    }),
    createMessage(4002, 'File', 1_731_496_400, {
      fileName: 'screenshots.zip',
      fileMime: 'application/zip',
      fileBytes: 8_400_000,
      sender: { displayName: 'Casey' },
    }),
  ]

  const apps = [
    createMessage(5001, 'Webxdc', 1_731_566_000, {
      fileName: 'shared-notes.xdc',
      fileMime: 'application/webxdc+zip',
      fileBytes: 290_000,
      sender: { displayName: 'Dana' },
    }),
    createMessage(5002, 'Webxdc', 1_731_480_000, {
      fileName: 'weekly-poll.xdc',
      fileMime: 'application/webxdc+zip',
      fileBytes: 180_000,
      sender: { displayName: 'Dana' },
    }),
  ]

  const messages = [...images, ...videos, ...audios, ...files, ...apps]
  const webxdcInfoById = new Map<number, FixtureWebxdcInfo>([
    [
      5001,
      {
        name: 'Shared Notes',
        summary: 'Collaborative notes for this chat',
        document: 'planning-notes.md',
      },
    ],
    [
      5002,
      {
        name: 'Poll',
        summary: 'Weekly planning poll',
        document: 'meeting-poll.md',
      },
    ],
  ])

  return {
    messages: new Map(messages.map(message => [message.id, message])),
    webxdcInfoById,
  }
}

function withBusyDensity(baseState: FixtureState): FixtureState {
  const originalMessages = [...baseState.messages.values()]
  const images = originalMessages.filter(
    message => message.viewType === 'Image' || message.viewType === 'Gif'
  )
  const videos = originalMessages.filter(message => message.viewType === 'Video')
  const audios = originalMessages.filter(
    message => message.viewType === 'Audio' || message.viewType === 'Voice'
  )
  const files = originalMessages.filter(message => message.viewType === 'File')
  const apps = originalMessages.filter(message => message.viewType === 'Webxdc')

  const appended = [
    ...cloneWithOffset(images, 6000, 14, 1_200),
    ...cloneWithOffset(videos, 7000, 6, 1_400),
    ...cloneWithOffset(audios, 8000, 10, 900),
    ...cloneWithOffset(files, 9000, 16, 1_000),
    ...cloneWithOffset(apps, 10000, 4, 1_600),
  ]

  const messages = new Map<number, FixtureMessage>(baseState.messages)
  const webxdcInfoById = new Map<number, FixtureWebxdcInfo>(
    baseState.webxdcInfoById
  )

  appended.forEach(message => {
    messages.set(message.id, message)

    if (message.viewType === 'Webxdc') {
      webxdcInfoById.set(message.id, {
        name: `Fixture App ${message.id}`,
        summary: 'Generated busy fixture app entry',
        document: null,
      })
    }
  })

  return {
    messages,
    webxdcInfoById,
  }
}

function buildFixtureState(density: FixtureDensity): FixtureState {
  const baseState = buildBaseState()
  return density === 'busy' ? withBusyDensity(baseState) : baseState
}

let fixtureState = buildFixtureState('normal')

export function setFixtureDensity(density: FixtureDensity) {
  fixtureState = buildFixtureState(density)
}

function toLoadResult(message: FixtureMessage): T.MessageLoadResult {
  return {
    kind: 'message',
    ...message,
  } as T.MessageLoadResult
}

function getMessageIdsByTypes(
  state: FixtureState,
  chatId: number | null,
  viewTypes: T.Viewtype[]
): number[] {
  return [...state.messages.values()]
    .filter(message => {
      if (chatId !== null && message.chatId !== chatId) {
        return false
      }
      return viewTypes.includes(message.viewType)
    })
    .sort((left, right) => left.timestamp - right.timestamp)
    .map(message => message.id)
}

const contextEmitters = new Map<number, EventEmitter>()
const globalEmitter = createEmitter()

const fixtureBackend: BaseDeltaChat<any> = {
  rpc: {
    async getChatMedia(
      _accountId: number,
      chatId: number | null,
      viewType: T.Viewtype,
      additionalViewType: T.Viewtype | null,
      _orphanedParam: number | null
    ) {
      const viewTypes: T.Viewtype[] = [viewType]
      if (additionalViewType) {
        viewTypes.push(additionalViewType)
      }

      return getMessageIdsByTypes(fixtureState, chatId, viewTypes)
    },

    async getMessages(_accountId: number, messageIds: number[]) {
      const result: Record<number, T.MessageLoadResult> = {}

      messageIds.forEach(messageId => {
        const message = fixtureState.messages.get(messageId)
        if (message) {
          result[messageId] = toLoadResult(message)
          return
        }

        result[messageId] = {
          kind: 'loadingError',
          error: `Fixture message ${messageId} not found`,
        }
      })

      return result
    },

    async getWebxdcInfo(_accountId: number, messageId: number) {
      const webxdcInfo = fixtureState.webxdcInfoById.get(messageId)
      if (!webxdcInfo) {
        throw new Error(`Missing fixture webxdc info for message ${messageId}`)
      }
      return webxdcInfo
    },
  },

  on(eventType: string, callback: EventCallback) {
    globalEmitter.on(eventType, callback)
  },

  off(eventType: string, callback: EventCallback) {
    globalEmitter.off(eventType, callback)
  },

  getContextEvents(accountId: number) {
    if (!contextEmitters.has(accountId)) {
      contextEmitters.set(accountId, createEmitter())
    }
    return contextEmitters.get(accountId) as any
  },
} as BaseDeltaChat<any>

export function createFixtureDeltaChatConnection() {
  return fixtureBackend
}
