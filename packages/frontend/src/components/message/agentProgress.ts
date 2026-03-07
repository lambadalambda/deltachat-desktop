export type AgentProgressState =
  | 'thinking'
  | 'running'
  | 'done'
  | 'failed'
  | 'cancelled'

export type AgentProgressCallStatus = 'run' | 'ok' | 'err' | 'cancel'

export interface AgentProgressCall {
  seq: number
  status: AgentProgressCallStatus
  tool: string
  label: string | null
}

export interface AgentProgressMessage {
  version: number | null
  runId: string | null
  state: AgentProgressState
  currentTool: string | null
  calls: AgentProgressCall[]
}

const HEADER_REGEX =
  /^Agent progress \(v(\d+)(?:,\s*run=([^)]+))?\):\s*([a-zA-Z]+)(?:\s+(.+))?$/

const CALL_LINE_REGEX = /^\s*(\d+)\.\s+([a-zA-Z]+)\s+(.+)$/

export function parseAgentProgressMessage(
  text: string
): AgentProgressMessage | null {
  const normalizedText = text.trimStart()
  if (!normalizedText.startsWith('Agent progress (v1')) {
    return null
  }

  const lines = normalizedText.replace(/\r\n?/g, '\n').split('\n')
  const headerLine = lines[0]?.trim() || ''

  const headerMatch = headerLine.match(HEADER_REGEX)
  if (!headerMatch) {
    return null
  }

  const state = normalizeState(headerMatch[3])
  if (state === null) {
    return null
  }

  const version = Number.parseInt(headerMatch[1], 10)
  if (version !== 1) {
    return null
  }

  const runId = headerMatch[2]?.trim() || null
  const currentTool = headerMatch[4]?.trim() || null
  const parsedCalls = parseCalls(lines)
  if (parsedCalls === null) {
    return null
  }

  return {
    version,
    runId,
    state,
    currentTool,
    calls: parsedCalls,
  }
}

function normalizeState(rawState: string): AgentProgressState | null {
  const state = rawState.toLowerCase()

  if (state === 'thinking') {
    return 'thinking'
  }
  if (state === 'running') {
    return 'running'
  }
  if (state === 'done') {
    return 'done'
  }
  if (state === 'failed' || state === 'error') {
    return 'failed'
  }
  if (state === 'cancelled' || state === 'canceled') {
    return 'cancelled'
  }

  return null
}

function parseCalls(lines: string[]): AgentProgressCall[] | null {
  const callsHeaderIndex = lines.findIndex(
    line => line.trim().toLowerCase() === 'calls:'
  )
  if (callsHeaderIndex === -1) {
    for (const line of lines.slice(1)) {
      if (line.trim() !== '') {
        return null
      }
    }
    return []
  }

  for (const line of lines.slice(1, callsHeaderIndex)) {
    if (line.trim() !== '') {
      return null
    }
  }

  const calls: AgentProgressCall[] = []
  for (const line of lines.slice(callsHeaderIndex + 1)) {
    if (line.trim() === '') {
      continue
    }

    const match = line.match(CALL_LINE_REGEX)
    if (!match) {
      return null
    }

    const status = normalizeCallStatus(match[2])
    if (status === null) {
      return null
    }

    const call = parseCallPayload(match[3])
    if (call === null) {
      return null
    }

    calls.push({
      seq: Number.parseInt(match[1], 10),
      status,
      tool: call.tool,
      label: call.label,
    })
  }
  return calls
}

function normalizeCallStatus(
  rawStatus: string
): AgentProgressCallStatus | null {
  const status = rawStatus.toLowerCase()

  if (status === 'run' || status === 'running') {
    return 'run'
  }
  if (status === 'ok' || status === 'done') {
    return 'ok'
  }
  if (status === 'err' || status === 'error' || status === 'fail') {
    return 'err'
  }
  if (status === 'cancel' || status === 'cancelled' || status === 'canceled') {
    return 'cancel'
  }

  return null
}

function parseCallPayload(
  rawPayload: string
): { tool: string; label: string | null } | null {
  const payload = rawPayload.trim()
  if (!payload) {
    return null
  }

  const separatorMatch = payload.match(/\s(?:-|\u2013|\u2014)\s/)
  if (!separatorMatch || separatorMatch.index === undefined) {
    return { tool: payload, label: null }
  }

  const separatorStart = separatorMatch.index + 1
  const separatorEnd = separatorStart + separatorMatch[0].trim().length
  const tool = payload.slice(0, separatorStart).trim()
  const label = payload.slice(separatorEnd).trim()

  if (!tool) {
    return null
  }

  return {
    tool,
    label: label || null,
  }
}

export function formatAgentProgressCall(call: AgentProgressCall): string {
  if (!call.label) {
    return call.tool
  }
  return `${call.tool} - ${call.label}`
}

export function getCollapsedAgentProgressText(
  progress: AgentProgressMessage
): string {
  const call = getCollapsedAgentProgressCall(progress)
  if (call !== null) {
    return formatAgentProgressCall(call)
  }

  if (progress.currentTool) {
    return progress.currentTool
  }

  return progress.state
}

export function getCollapsedAgentProgressCall(
  progress: AgentProgressMessage
): AgentProgressCall | null {
  if (progress.calls.length === 0) {
    return null
  }

  if (progress.state === 'running' || progress.state === 'thinking') {
    for (let i = progress.calls.length - 1; i >= 0; i--) {
      if (progress.calls[i].status === 'run') {
        return progress.calls[i]
      }
    }
    return null
  }

  return progress.calls[progress.calls.length - 1]
}

export function isActiveAgentProgressState(state: AgentProgressState): boolean {
  return state === 'thinking' || state === 'running'
}
