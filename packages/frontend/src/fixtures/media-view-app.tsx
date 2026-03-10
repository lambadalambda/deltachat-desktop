import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'

import Gallery from '../components/Gallery'
import { ChatContext } from '../contexts/ChatContext'
import { ContextMenuProvider } from '../contexts/ContextMenuContext'
import { DialogContextProvider } from '../contexts/DialogContext'
import { I18nContext } from '../contexts/I18nContext'
import {
  FIXTURE_CHAT_ID,
  type FixtureDensity,
  setFixtureDensity,
} from './mediaViewFixtureBackend'

import type { ChatContextValue } from '../contexts/ChatContext'

const chatContextValue: ChatContextValue = {
  chatId: FIXTURE_CHAT_ID,
  loadingChat: false,
  selectChat: () => {},
  unselectChat: () => {},
}

function FixtureApp() {
  const [density, setDensity] = useState<FixtureDensity>('normal')
  const [galleryInstanceId, setGalleryInstanceId] = useState(0)

  const i18nValue = useMemo(
    () => ({
      tx: window.static_translate,
      writingDirection: 'ltr' as const,
    }),
    []
  )

  return (
    <I18nContext.Provider value={i18nValue}>
      <ChatContext.Provider value={chatContextValue}>
        <DialogContextProvider>
          <ContextMenuProvider>
            <main className='fixture-shell'>
              <header className='fixture-header'>
                <div>
                  <div className='fixture-title'>Apps and Media Fixture</div>
                  <div className='fixture-note'>
                    Uses real Gallery components with fake backend data.
                  </div>
                </div>

                <div className='fixture-toolbar'>
                  <label htmlFor='fixture-density' className='fixture-note'>
                    Density
                  </label>
                  <select
                    id='fixture-density'
                    className='fixture-select'
                    value={density}
                    onChange={event => {
                      const nextDensity: FixtureDensity =
                        event.target.value === 'busy' ? 'busy' : 'normal'
                      setFixtureDensity(nextDensity)
                      setDensity(nextDensity)
                      setGalleryInstanceId(previous => previous + 1)
                    }}
                  >
                    <option value='normal'>Normal</option>
                    <option value='busy'>Busy chat</option>
                  </select>
                </div>
              </header>

              <section className='fixture-content'>
                <Gallery key={galleryInstanceId} chatId='all' />
              </section>
            </main>
          </ContextMenuProvider>
        </DialogContextProvider>
      </ChatContext.Provider>
    </I18nContext.Provider>
  )
}

const rootElement = document.querySelector('#root')
if (!rootElement) {
  throw new Error('Missing #root element for fixture app')
}

setFixtureDensity('normal')
createRoot(rootElement).render(<FixtureApp />)
