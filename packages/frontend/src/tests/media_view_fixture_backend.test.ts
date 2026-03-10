import { expect } from 'chai'
import { describe, it } from 'mocha'

import {
  createFixtureDeltaChatConnection,
  FIXTURE_ACCOUNT_ID,
  setFixtureDensity,
} from '../fixtures/mediaViewFixtureBackend.js'

describe('mediaViewFixtureBackend', () => {
  it('returns image and gif ids for gallery image requests', async () => {
    setFixtureDensity('normal')
    const backend = createFixtureDeltaChatConnection()

    const mediaIds = await backend.rpc.getChatMedia(
      FIXTURE_ACCOUNT_ID,
      null,
      'Gif',
      'Image',
      null
    )

    expect(mediaIds.length).to.be.greaterThan(0)

    const messages = await backend.rpc.getMessages(FIXTURE_ACCOUNT_ID, mediaIds)
    const viewTypes = mediaIds.map((id: number) =>
      messages[id].kind === 'message' ? messages[id].viewType : null
    )

    expect(
      viewTypes.every((type: string | null) => type === 'Gif' || type === 'Image')
    ).to.equal(true)
  })

  it('returns more fixture items in busy density', async () => {
    const backend = createFixtureDeltaChatConnection()

    setFixtureDensity('normal')
    const normalFileIds = await backend.rpc.getChatMedia(
      FIXTURE_ACCOUNT_ID,
      null,
      'File',
      null,
      null
    )

    setFixtureDensity('busy')
    const busyFileIds = await backend.rpc.getChatMedia(
      FIXTURE_ACCOUNT_ID,
      null,
      'File',
      null,
      null
    )

    expect(busyFileIds.length).to.be.greaterThan(normalFileIds.length)
  })

  it('exposes webxdc info for fixture apps', async () => {
    setFixtureDensity('normal')
    const backend = createFixtureDeltaChatConnection()

    const appIds = await backend.rpc.getChatMedia(
      FIXTURE_ACCOUNT_ID,
      null,
      'Webxdc',
      null,
      null
    )
    expect(appIds.length).to.be.greaterThan(0)

    const webxdcInfo = await backend.rpc.getWebxdcInfo(
      FIXTURE_ACCOUNT_ID,
      appIds[0]
    )
    expect(webxdcInfo.name).to.be.a('string')
    expect(webxdcInfo.name.length).to.be.greaterThan(0)
  })
})
