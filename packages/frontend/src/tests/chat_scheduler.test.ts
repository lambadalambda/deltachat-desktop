import { expect } from 'chai'
import { before, describe, it } from 'mocha'

import { ChatStoreScheduler } from '../stores/chat/chat_scheduler.js'
import { setLogHandler } from '../../../shared/logger.js'

async function waitFor(
  condition: () => boolean,
  timeoutMs = 1000,
  intervalMs = 5
) {
  const deadline = Date.now() + timeoutMs
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for condition')
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
}

describe('ChatStoreScheduler', () => {
  before(() => {
    setLogHandler(() => {}, {} as any)
  })

  it('runs queued effects in FIFO order', async () => {
    const scheduler = new ChatStoreScheduler()
    const executionOrder: string[] = []

    const effect = scheduler.queuedEffect(
      async (label: string) => {
        executionOrder.push(label)
        await new Promise(resolve => setTimeout(resolve, 0))
        return true
      },
      'effect'
    )

    const [result1, result2, result3] = await Promise.all([
      effect('first'),
      effect('second'),
      effect('third'),
    ])

    expect(result1).to.equal(true)
    expect(result2).to.equal(false)
    expect(result3).to.equal(false)

    await waitFor(() => executionOrder.length === 3)
    await waitFor(() => scheduler.isLocked('queue') === false)
    expect(executionOrder).to.deep.equal(['first', 'second', 'third'])
    expect(scheduler.isLocked('queue')).to.equal(false)
  })

  it('continues processing queued effects after a thrown error', async () => {
    const scheduler = new ChatStoreScheduler()
    const executionOrder: string[] = []

    const effect = scheduler.queuedEffect(
      async (label: string) => {
        if (label === 'first') {
          throw new Error('boom')
        }
        executionOrder.push(label)
        return true
      },
      'effect'
    )

    await Promise.all([effect('first'), effect('second'), effect('third')])

    await waitFor(() => executionOrder.length === 2)
    await waitFor(() => scheduler.isLocked('queue') === false)
    expect(executionOrder).to.deep.equal(['second', 'third'])
    expect(scheduler.isLocked('queue')).to.equal(false)
  })

  it('unlocks lock when lockedEffect returns false', async () => {
    const scheduler = new ChatStoreScheduler()
    const effect = scheduler.lockedEffect(
      'scroll',
      async () => false,
      'effect'
    )

    const result = await effect()
    expect(result).to.equal(false)
    expect(scheduler.isLocked('scroll')).to.equal(false)
  })

  it('unlocks lock when lockedEffect throws', async () => {
    const scheduler = new ChatStoreScheduler()
    const effect = scheduler.lockedEffect(
      'scroll',
      async () => {
        throw new Error('boom')
      },
      'effect'
    )

    await effect()
    expect(scheduler.isLocked('scroll')).to.equal(false)
  })
})
