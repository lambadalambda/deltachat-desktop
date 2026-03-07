import React, { useId, useMemo, useState } from 'react'
import classNames from 'classnames'
import useTranslationFunction from '../../hooks/useTranslationFunction'

import {
  AgentProgressCall,
  AgentProgressMessage,
  formatAgentProgressCall,
  getCollapsedAgentProgressText,
  isActiveAgentProgressState,
} from './agentProgress'

function getStatusLabel(status: AgentProgressCall['status']): string {
  if (status === 'run') {
    return 'agent_progress_status_running'
  }
  if (status === 'ok') {
    return 'agent_progress_status_ok'
  }
  if (status === 'err') {
    return 'agent_progress_status_failed'
  }
  return 'agent_progress_status_cancelled'
}

function getStateLabel(state: AgentProgressMessage['state']): string {
  if (state === 'thinking') {
    return 'agent_progress_status_thinking'
  }
  if (state === 'running') {
    return 'agent_progress_status_running'
  }
  if (state === 'done') {
    return 'done'
  }
  if (state === 'failed') {
    return 'agent_progress_status_failed'
  }
  return 'agent_progress_status_cancelled'
}

export default function AgentProgressMessageContent({
  progress,
  tabindexForInteractiveContents,
}: {
  progress: AgentProgressMessage
  tabindexForInteractiveContents: -1 | 0
}) {
  const [expanded, setExpanded] = useState(false)
  const tx = useTranslationFunction()
  const callsListId = useId()

  const collapsedText = useMemo(
    () => getCollapsedAgentProgressText(progress),
    [progress]
  )
  const isActive = isActiveAgentProgressState(progress.state)
  const canExpand = progress.calls.length > 1
  const shouldUseStateLabel =
    progress.calls.length === 0 && progress.currentTool === null
  const shownCollapsedText = shouldUseStateLabel
    ? tx(getStateLabel(progress.state))
    : collapsedText

  return (
    <div className='agent-progress'>
      <div className='agent-progress-current-row'>
        <span
          className='agent-progress-current-text'
          title={shownCollapsedText}
        >
          {shownCollapsedText}
        </span>
        {isActive && (
          <>
            <span className='visually-hidden'>
              {tx(getStateLabel(progress.state))}
            </span>
            <span className='agent-progress-loader' aria-hidden='true'>
              <span />
              <span />
              <span />
            </span>
          </>
        )}
      </div>
      {canExpand && (
        <button
          type='button'
          className='agent-progress-toggle'
          onClick={() => setExpanded(previous => !previous)}
          tabIndex={tabindexForInteractiveContents}
          aria-expanded={expanded}
          aria-controls={callsListId}
        >
          {expanded
            ? tx('agent_progress_hide_calls')
            : tx('agent_progress_show_calls', String(progress.calls.length))}
        </button>
      )}
      {canExpand && (
        <ol
          className='agent-progress-calls'
          id={callsListId}
          hidden={!expanded}
        >
          {progress.calls.map((call, index) => {
            const fullCallText = formatAgentProgressCall(call)
            return (
              <li
                key={`${call.seq}-${call.tool}-${index}`}
                className='agent-progress-call'
              >
                <span
                  className={classNames(
                    'agent-progress-call-status',
                    call.status
                  )}
                >
                  {tx(getStatusLabel(call.status))}
                </span>
                <span className='agent-progress-call-text' title={fullCallText}>
                  {fullCallText}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
