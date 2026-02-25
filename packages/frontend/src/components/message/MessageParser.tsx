import React, { useContext } from 'react'

import * as linkify from 'linkifyjs'
import 'linkify-plugin-hashtag'
import '../../utils/linkify/plugin-bot-command/index.js'

import { Link } from './Link.js'
import { parseElements } from '../../utils/linkify/parseElements.js'
import type { LinkDestination } from './Link.js'
import { parseMarkdown } from '../../utils/markdown/parseMarkdown.js'
import type { MessageMarkdownElement } from '../../utils/markdown/parseMarkdown.js'
import { getLogger } from '@deltachat-desktop/shared/logger'
import { ActionEmitter, KeybindAction } from '../../keybindings'
import { BackendRemote } from '../../backend-com'
import { selectedAccountId } from '../../ScreenController'
import { MessagesDisplayContext } from '../../contexts/MessagesDisplayContext'
import useChat from '../../hooks/chat/useChat'
import useCreateChatByEmail from '../../hooks/chat/useCreateChatByEmail'

const log = getLogger('renderer/message-parser')

type ParseAndRenderMode = 'interactive' | 'non_interactive' | 'summary'

function renderLinkifyElement(
  elm: linkify.MultiToken,
  tabindexForInteractiveContents: -1 | 0,
  key?: React.Key
): React.ReactElement {
  switch (elm.t) {
    case 'hashtag':
      return (
        <TagLink
          key={key}
          tag={elm.v}
          tabIndex={tabindexForInteractiveContents}
        />
      )

    /**
     * linkifyJS does even identify URLs without scheme as URL, e.g.
     * "www.example.com" or "example.com/test" or "example.com?param=value" etc.
     * It does only identify valid TLDs based on https://data.iana.org/TLD/tlds-alpha-by-domain.txt
     */
    case 'url': {
      const hasScheme = elm.tk.some(t =>
        ['SLASH_SCHEME', 'SCHEME'].includes(t.t)
      )
      const destination = createLinkDestination(elm.v, hasScheme, elm.v)
      return (
        <Link
          destination={destination}
          key={key}
          tabIndex={tabindexForInteractiveContents}
        />
      )
    }

    case 'email': {
      const email = elm.v
      return (
        <EmailLink
          key={key}
          email={email}
          tabIndex={tabindexForInteractiveContents}
        />
      )
    }

    case 'botcommand':
      return (
        <BotCommandSuggestion
          key={key}
          suggestion={elm.v}
          tabIndex={tabindexForInteractiveContents}
        />
      )

    case 'nl':
      return <span key={key}>{'\n'}</span>

    case 'text':
      return <span key={key}>{elm.v}</span>
    default:
      log.error(`type ${elm.t} not known/implemented yet`, elm)
      return (
        <span key={key} style={{ color: 'red' }}>
          {elm.v}
        </span>
      )
  }
}

function createLinkDestination(
  rawTarget: string,
  hasScheme: boolean,
  linkText?: string
): LinkDestination {
  const fullTarget = hasScheme ? rawTarget : 'https://' + rawTarget
  const normalizedUrl = new URL(fullTarget)
  const suspiciousUrl =
    stripLastSlash(normalizedUrl.href) !== stripLastSlash(fullTarget)

  return {
    target: fullTarget,
    hostname: normalizedUrl.hostname,
    punycode: suspiciousUrl
      ? {
          ascii_hostname: normalizedUrl.hostname,
          punycode_encoded_url: normalizedUrl.href,
          original_hostname_or_full_url: rawTarget,
        }
      : null,
    scheme: normalizedUrl.protocol.replace(':', ''),
    linkText,
  }
}

function stripLastSlash(url: string): string {
  if (!url.endsWith('/')) {
    return url
  }
  return url.slice(0, -1)
}

function renderInteractiveText(
  text: string,
  tabindexForInteractiveContents: -1 | 0,
  key: React.Key
) {
  const elements = parseElements(text)
  return (
    <React.Fragment key={key}>
      {elements.map((element, index) =>
        renderLinkifyElement(
          element,
          tabindexForInteractiveContents,
          `${key as string}:${index}`
        )
      )}
    </React.Fragment>
  )
}

function renderMarkdownElement(
  element: MessageMarkdownElement,
  mode: Exclude<ParseAndRenderMode, 'summary'>,
  tabindexForInteractiveContents: -1 | 0,
  key: React.Key
): React.ReactElement {
  switch (element.t) {
    case 'text':
      return mode === 'interactive' ? (
        renderInteractiveText(element.c, tabindexForInteractiveContents, key)
      ) : (
        <span key={key}>{element.c}</span>
      )

    case 'inline_code':
      return (
        <code className='mm-inline-code' key={key}>
          {element.c}
        </code>
      )

    case 'code_block':
      if (mode === 'non_interactive') {
        return (
          <code className='mm-inline-code' key={key}>
            {element.c.content}
          </code>
        )
      }
      return (
        <code className='mm-code' key={key}>
          {element.c.language && <span>{element.c.language}</span>}
          {element.c.content}
        </code>
      )

    case 'bold':
      return (
        <b key={key}>
          {element.c.map((child, index) =>
            renderMarkdownElement(
              child,
              mode,
              tabindexForInteractiveContents,
              `${key as string}:bold:${index}`
            )
          )}
        </b>
      )

    case 'italic':
      return (
        <i key={key}>
          {element.c.map((child, index) =>
            renderMarkdownElement(
              child,
              mode,
              tabindexForInteractiveContents,
              `${key as string}:italic:${index}`
            )
          )}
        </i>
      )

    case 'strike':
      return (
        <s key={key}>
          {element.c.map((child, index) =>
            renderMarkdownElement(
              child,
              mode,
              tabindexForInteractiveContents,
              `${key as string}:strike:${index}`
            )
          )}
        </s>
      )

    case 'markdown_link': {
      const label =
        element.c.label.length > 0
          ? element.c.label.map((child, index) =>
              renderMarkdownElement(
                child,
                'non_interactive',
                tabindexForInteractiveContents,
                `${key as string}:label:${index}`
              )
            )
          : [<span key={`${key as string}:label:fallback`}>{element.c.target}</span>]

      if (mode === 'non_interactive') {
        return <span key={key}>{label}</span>
      }

      const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(element.c.target)

      let destination: LinkDestination
      try {
        destination = createLinkDestination(element.c.target, hasScheme)
      } catch {
        return <span key={key}>{label}</span>
      }

      return (
        <Link
          destination={destination}
          key={key}
          tabIndex={tabindexForInteractiveContents}
        >
          {label}
        </Link>
      )
    }
  }
}

/**
 * Parse message text (for links and markdown formatting)
 * and render as React elements
 *
 * @param mode
 * - `summary`: render plain text summary for chat list
 * - `non_interactive`: render markdown formatting without interactive links
 * - `interactive`: render markdown formatting and interactive links
 */
export function parseAndRenderMessage(
  message: string,
  modeOrPreview: ParseAndRenderMode | boolean,
  /**
   * Has no effect if mode is `summary`.
   */
  tabindexForInteractiveContents: -1 | 0
): React.ReactElement {
  const mode: ParseAndRenderMode =
    typeof modeOrPreview === 'boolean'
      ? modeOrPreview
        ? 'summary'
        : 'interactive'
      : modeOrPreview

  if (mode === 'summary') {
    return <div className='truncated'>{message}</div>
  }

  try {
    const elements = parseMarkdown(message)
    return (
      <>
        {elements.map((el, index) =>
          renderMarkdownElement(
            el,
            mode,
            tabindexForInteractiveContents,
            index
          )
        )}
      </>
    )
  } catch (error) {
    log.error('parseAndRenderMessage failed:', { input: message, error })
    return <>{message}</>
  }
}

function EmailLink({
  email,
  tabIndex,
}: {
  email: string
  tabIndex: -1 | 0
}): React.ReactElement {
  const accountId = selectedAccountId()
  const createChatByEmail = useCreateChatByEmail()
  const { selectChat } = useChat()

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = async ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const chatId = await createChatByEmail(accountId, email)
    if (chatId) {
      selectChat(accountId, chatId)
    }
  }

  return (
    <a
      href={`mailto:${email}`}
      x-not-a-link='email'
      x-target-email={email}
      onClick={handleClick}
      tabIndex={tabIndex}
    >
      {email}
    </a>
  )
}

function TagLink({ tag, tabIndex }: { tag: string; tabIndex: -1 | 0 }) {
  const setSearch = () => {
    log.debug(
      `Clicked on a hashtag, this should open search for the text "${tag}"`
    )
    if (window.__chatlistSetSearch) {
      window.__chatlistSetSearch(tag, null)
      ActionEmitter.emitAction(KeybindAction.ChatList_FocusSearchInput)
    }
  }

  return (
    <a href={'#'} x-not-a-link='tag' onClick={setSearch} tabIndex={tabIndex}>
      {tag}
    </a>
  )
}

function BotCommandSuggestion({
  suggestion,
  tabIndex,
}: {
  suggestion: string
  tabIndex: -1 | 0
}) {
  const messageDisplay = useContext(MessagesDisplayContext)
  const accountId = selectedAccountId()
  const { selectChat } = useChat()

  const applySuggestion = async () => {
    if (!messageDisplay) {
      return
    }

    let chatId
    if (messageDisplay.context == 'contact_profile_status') {
      // Bot command was clicked inside of a contact status
      chatId = await BackendRemote.rpc.createChatByContactId(
        accountId,
        messageDisplay.contact_id
      )
      // also select the chat and close the profile window if this is the case
      selectChat(accountId, chatId)
      messageDisplay.closeProfileDialog()
    } else if (messageDisplay.context == 'chat_messagelist') {
      // nothing special to do
      chatId = messageDisplay.chatId
    } else {
      log.error(
        'Error applying BotCommandSuggestion: MessageDisplayContext.type is not implemented: ',
        //@ts-ignore
        messageDisplay.type
      )
      return
    }

    // Copy-pasted from `useCreateDraftMesssage`.
    if (window.__setDraftRequest != undefined) {
      log.error('previous BotCommandSuggestion has not worked?')
    }
    window.__setDraftRequest = {
      accountId,
      chatId,
      text: suggestion,
    }
    window.__checkSetDraftRequest?.()
  }

  return (
    <a
      href='#'
      x-not-a-link='bcs'
      onClick={applySuggestion}
      tabIndex={tabIndex}
    >
      {suggestion}
    </a>
  )
}
