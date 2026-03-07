import { expect } from 'chai'
import { describe, it } from 'mocha'

import {
  formatAgentProgressCall,
  getCollapsedAgentProgressText,
  parseAgentProgressMessage,
} from '../components/message/agentProgress.js'

describe('agentProgress parser', () => {
  it('parses running progress and shows current tool call', () => {
    const message =
      'Agent progress (v1, run=R42): running web.search\n' +
      'Calls:\n' +
      '1. ok fs.read_file - read input file\n' +
      '2. run web.search - search docs'

    const parsed = parseAgentProgressMessage(message)
    expect(parsed).to.not.equal(null)
    expect(parsed?.runId).to.equal('R42')
    expect(parsed?.state).to.equal('running')
    expect(parsed?.calls.length).to.equal(2)
    expect(parsed?.calls[1]).to.deep.equal({
      seq: 2,
      status: 'run',
      tool: 'web.search',
      label: 'search docs',
    })
    expect(getCollapsedAgentProgressText(parsed!)).to.equal(
      'web.search - search docs'
    )
  })

  it('parses done progress and shows the last tool call', () => {
    const message =
      'Agent progress (v1): done web.search\n' +
      'Calls:\n' +
      '1. ok fs.read_file\n' +
      '2. ok web.search - search docs'

    const parsed = parseAgentProgressMessage(message)
    expect(parsed).to.not.equal(null)
    expect(parsed?.state).to.equal('done')
    expect(getCollapsedAgentProgressText(parsed!)).to.equal(
      'web.search - search docs'
    )
  })

  it('falls back to current tool when no calls are present', () => {
    const parsed = parseAgentProgressMessage(
      'Agent progress (v1): thinking planner'
    )
    expect(parsed).to.not.equal(null)
    expect(getCollapsedAgentProgressText(parsed!)).to.equal('planner')
  })

  it('uses current tool while running when no call is marked as running', () => {
    const message =
      'Agent progress (v1): running web.search\n' +
      'Calls:\n' +
      '1. ok fs.read_file\n' +
      '2. ok planner.prepare'

    const parsed = parseAgentProgressMessage(message)
    expect(parsed).to.not.equal(null)
    expect(getCollapsedAgentProgressText(parsed!)).to.equal('web.search')
  })

  it('returns null when unexpected lines are present', () => {
    const message =
      'Agent progress (v1): running web.search\n' +
      'Calls:\n' +
      '1. run web.search\n' +
      'unexpected trailing line'

    expect(parseAgentProgressMessage(message)).to.equal(null)
  })

  it('returns null when an unsupported call status is used', () => {
    const message =
      'Agent progress (v1): running web.search\n' +
      'Calls:\n' +
      '1. maybe web.search'

    expect(parseAgentProgressMessage(message)).to.equal(null)
  })

  it('returns null when calls section is preceded by text', () => {
    const message =
      'Agent progress (v1): running web.search\n' +
      'note: not part of the schema\n' +
      'Calls:\n' +
      '1. run web.search'

    expect(parseAgentProgressMessage(message)).to.equal(null)
  })

  it('returns null for regular messages', () => {
    expect(parseAgentProgressMessage('hello world')).to.equal(null)
  })

  it('returns null for unsupported progress version', () => {
    expect(
      parseAgentProgressMessage('Agent progress (v2): running planner')
    ).to.equal(null)
  })

  it('formats call labels consistently', () => {
    expect(
      formatAgentProgressCall({
        seq: 2,
        status: 'ok',
        tool: 'fs.read_file',
        label: 'read config',
      })
    ).to.equal('fs.read_file - read config')
    expect(
      formatAgentProgressCall({
        seq: 3,
        status: 'ok',
        tool: 'shell.exec',
        label: null,
      })
    ).to.equal('shell.exec')
  })
})
