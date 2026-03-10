import type { Runtime } from '@deltachat-desktop/runtime-interface'

import {
  createFixtureDeltaChatConnection,
  FIXTURE_ACCOUNT_ID,
  setFixtureDensity,
} from './mediaViewFixtureBackend'

const STRINGS: Record<string, string> = {
  all_apps_and_media: 'All Apps and Media',
  apps_and_media: 'Apps and Media',
  attachment_failed_to_load: 'Attachment failed to load',
  audio: 'Audio',
  emoji_recent: 'Recent',
  files: 'Files',
  images: 'Images',
  search_files: 'Search files',
  search_no_result_for_x: 'No result',
  tab_all_media_empty_hint: 'Media attached to chats will appear here.',
  tab_audio_empty_hint: 'Audio files attached to this chat will appear here.',
  tab_image_empty_hint: 'Images attached to this chat will appear here.',
  tab_video_empty_hint: 'Videos attached to this chat will appear here.',
  tab_webxdc_empty_hint: 'Apps attached to this chat will appear here.',
  video: 'Video',
  webxdc_apps: 'Apps',
}

const tx = ((key: string, value?: string) => {
  if (key === 'search_no_result_for_x' && value) {
    return `No result for ${value}`
  }

  return STRINGS[key] || key
}) as any

setFixtureDensity('normal')

;(window as any).__selectedAccountId = FIXTURE_ACCOUNT_ID
;(window as any).localeData = {
  dir: 'ltr',
}
;(window as any).static_translate = tx

const fixtureBackend = createFixtureDeltaChatConnection()

const fixtureRuntime = {
  emitUIFullyReady() {},
  emitUIReady() {},
  createDeltaChatConnection() {
    return fixtureBackend
  },
  openMessageHTML() {},
  async getDesktopSettings() {
    return {
      locale: 'en',
    }
  },
  async setDesktopSetting() {},
  async initialize() {},
  reloadWebContent() {},
  openLogFile() {},
  async readCurrentLog() {
    return ''
  },
  getCurrentLogLocation() {
    return '/tmp/fixture.log'
  },
  openHelpWindow() {},
  getRC_Config() {
    return {}
  },
  getRuntimeInfo() {
    return {
      target: 'browser',
    }
  },
  openLink() {},
  async showOpenFileDialog() {
    return []
  },
  async downloadFile() {},
  transformBlobURL(blob: string) {
    return blob
  },
  transformStickerURL(stickerPath: string) {
    return stickerPath
  },
  async readClipboardText() {
    return ''
  },
  async readClipboardImage() {
    return null
  },
  async writeClipboardText() {},
  async writeClipboardImage() {},
  async getAppPath() {
    return '/tmp'
  },
  openMapsWebxdc() {},
  async openPath() {
    return ''
  },
  getConfigPath() {
    return '/tmp'
  },
  openWebxdc() {},
  getWebxdcIconURL() {
    return '/images/game.svg'
  },
  async deleteWebxdcAccountData() {},
  closeAllWebxdcInstances() {},
  notifyWebxdcStatusUpdate() {},
  notifyWebxdcRealtimeData() {},
  notifyWebxdcMessageChanged() {},
  notifyWebxdcInstanceDeleted() {},
  startOutgoingVideoCall() {},
  restartApp() {},
  async getLocaleData() {
    return {
      locale: 'en',
      dir: 'ltr',
      messages: {},
    }
  },
  async setLocale() {},
  setBadgeCounter() {},
  showNotification() {},
  clearAllNotifications() {},
  clearNotificationsForAccount() {},
  clearNotifications() {},
  setNotificationCallback() {},
  async writeTempFileFromBase64() {
    return '/tmp/base64-file'
  },
  async writeTempFile() {
    return '/tmp/text-file'
  },
  async copyFileToInternalTmpDir() {
    return '/tmp/copied-file'
  },
  async removeTempFile() {},
  async getAvailableThemes() {
    return []
  },
  async getActiveTheme() {
    return null
  },
  async saveBackgroundImage() {
    return '/tmp/background'
  },
  onDragFileOut() {},
  setDropListener() {},
  isDroppedFileFromOutside() {
    return true
  },
  async getAutostartState() {
    return {
      isSupported: false,
      isRegistered: null,
    }
  },
  onChooseLanguage: undefined,
  onThemeUpdate: undefined,
  onShowDialog: undefined,
  onOpenQrUrl: undefined,
  onWebxdcSendToChat: undefined,
  onResumeFromSleep: undefined,
  onToggleNotifications: undefined,
  async checkMediaAccess() {
    return 'granted'
  },
  async askForMediaAccess() {
    return true
  },
} as unknown as Runtime

;(window as any).r = fixtureRuntime
