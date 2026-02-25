import React, { useMemo } from 'react'
import classNames from 'classnames'

import { BackendRemote } from '../../backend-com'
import { selectedAccountId } from '../../ScreenController'
import useDialog from '../../hooks/dialog/useDialog'
import ReactionsDialog from '../dialogs/ReactionsDialog'
import Icon from '../Icon'
import {
  buildReactionPayload,
  canShowQuickReactButton,
} from './reactionHelpers'

import styles from './styles.module.scss'

import type { T } from '@deltachat/jsonrpc-client'
import useTranslationFunction from '../../hooks/useTranslationFunction'

// Reactions are sorted by their frequencies in the core, that is, the
// most used emojis come first in this list.

type Props = {
  messageId: number
  canSendReaction: boolean
  reactions: T.Reactions
  tabindexForInteractiveContents: -1 | 0
  messageWidth: number
}

export default function Reactions(props: Props) {
  const tx = useTranslationFunction()
  const accountId = selectedAccountId()

  const { messageWidth } = props

  const { openDialog } = useDialog()
  const { reactionsByContact, reactions } = props.reactions
  const myReaction = reactions.find(reaction => reaction.isFromSelf)?.emoji

  // Compute visibleEmojis and hiddenReactionsCount from props
  const { visibleEmojis, hiddenReactionsCount } = useMemo(() => {
    let emojiSpaces = 0
    if (messageWidth <= 234) {
      emojiSpaces = 1
    } else {
      emojiSpaces = Math.round((messageWidth - 200) / 34)
    }
    const totalReactionsCount = reactions.reduce(
      (sum, item) => sum + item.count,
      0
    )
    const visibleReactionsCount = reactions
      .slice(0, emojiSpaces)
      .reduce((sum, item) => sum + item.count, 0)
    if (reactions.length - emojiSpaces <= 1) {
      emojiSpaces++
      return { visibleEmojis: emojiSpaces, hiddenReactionsCount: 0 }
    } else {
      return {
        visibleEmojis: emojiSpaces,
        hiddenReactionsCount: totalReactionsCount - visibleReactionsCount,
      }
    }
  }, [messageWidth, reactions])

  const handleClick = () => {
    openDialog(ReactionsDialog, {
      reactionsByContact,
    })
  }

  const handleQuickReactClick = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    emoji: string
  ) => {
    event.stopPropagation()
    event.preventDefault()

    await BackendRemote.rpc.sendReaction(
      accountId,
      props.messageId,
      buildReactionPayload(myReaction, emoji, 'set')
    )
  }

  return (
    <div className={styles.reactions} onClick={handleClick}>
      {reactions.slice(0, visibleEmojis).map(({ emoji, isFromSelf, count }) => {
        return (
          <span className={styles.reactionItem} key={emoji}>
            <span
              className={classNames(styles.emoji, {
                [styles.isFromSelf]: isFromSelf,
              })}
            >
              {emoji}
              {count > 1 && <span className={styles.emojiCount}>{count}</span>}
            </span>

            {canShowQuickReactButton(props.canSendReaction, isFromSelf) && (
              <button
                type='button'
                className={styles.alsoReactButton}
                onClick={event => {
                  void handleQuickReactClick(event, emoji)
                }}
                aria-label={`${tx('react')} ${emoji}`}
                title={`${tx('react')} ${emoji}`}
                tabIndex={props.tabindexForInteractiveContents}
              >
                <Icon className={styles.alsoReactIcon} icon='plus' size={10} />
              </button>
            )}
          </span>
        )
      })}
      {reactions.length > visibleEmojis && (
        <span className={classNames(styles.emoji, styles.emojiCount)}>
          +{hiddenReactionsCount}
        </span>
      )}
      <button
        type='button'
        className={styles.openReactionsListDialogButton}
        aria-label={tx('more_info_desktop')}
        onClick={handleClick}
        tabIndex={props.tabindexForInteractiveContents}
      ></button>
    </div>
  )
}
