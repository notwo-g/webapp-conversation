'use client'
import type { FC } from 'react'
import type { FeedbackFunc } from '../type'
import type { ChatItem, MessageRating, VisionFile } from '@/types/app'
import type { Emoji } from '@/types/tools'
import { ChevronDownIcon, HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import copy from 'copy-to-clipboard'
import Button from '@/app/components/base/button'
import { Clipboard, ClipboardCheck } from '@/app/components/base/icons/line/files'
import RefreshCcw01 from '@/app/components/base/icons/line/refresh-ccw-01'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import Tooltip from '@/app/components/base/tooltip'
import WorkflowProcess from '@/app/components/workflow/workflow-process'
import { randomString } from '@/utils/string'
import ImageGallery from '../../base/image-gallery'
import LoadingAnim from '../loading-anim'
import s from '../style.module.css'
import Thought from '../thought'

function OperationBtn({ innerContent, onClick, className }: { innerContent: React.ReactNode, onClick?: () => void, className?: string }) {
  return (
    <div
      className={`relative box-border flex items-center justify-center h-7 w-7 rounded-lg border border-gray-200 bg-white cursor-pointer text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 ${className ?? ''}`}
      onClick={onClick && onClick}
    >
      {innerContent}
    </div>
  )
}

const RatingIcon: FC<{ isLike: boolean }> = ({ isLike }) => {
  return isLike ? <HandThumbUpIcon className="w-4 h-4" /> : <HandThumbDownIcon className="w-4 h-4" />
}

export const EditIconSolid: FC<{ className?: string }> = ({ className }) => {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path fillRule="evenodd" clip-rule="evenodd" d="M10.8374 8.63108C11.0412 8.81739 11.0554 9.13366 10.8691 9.33747L10.369 9.88449C10.0142 10.2725 9.52293 10.5001 9.00011 10.5001C8.47746 10.5001 7.98634 10.2727 7.63157 9.8849C7.45561 9.69325 7.22747 9.59515 7.00014 9.59515C6.77271 9.59515 6.54446 9.69335 6.36846 9.88517C6.18177 10.0886 5.86548 10.1023 5.66201 9.91556C5.45853 9.72888 5.44493 9.41259 5.63161 9.20911C5.98678 8.82201 6.47777 8.59515 7.00014 8.59515C7.52251 8.59515 8.0135 8.82201 8.36867 9.20911L8.36924 9.20974C8.54486 9.4018 8.77291 9.50012 9.00011 9.50012C9.2273 9.50012 9.45533 9.40182 9.63095 9.20979L10.131 8.66276C10.3173 8.45895 10.6336 8.44476 10.8374 8.63108Z" fill="#6B7280" />
      <path fillRule="evenodd" clip-rule="evenodd" d="M7.89651 1.39656C8.50599 0.787085 9.49414 0.787084 10.1036 1.39656C10.7131 2.00604 10.7131 2.99419 10.1036 3.60367L3.82225 9.88504C3.81235 9.89494 3.80254 9.90476 3.79281 9.91451C3.64909 10.0585 3.52237 10.1855 3.3696 10.2791C3.23539 10.3613 3.08907 10.4219 2.93602 10.4587C2.7618 10.5005 2.58242 10.5003 2.37897 10.5001C2.3652 10.5001 2.35132 10.5001 2.33732 10.5001H1.50005C1.22391 10.5001 1.00005 10.2763 1.00005 10.0001V9.16286C1.00005 9.14886 1.00004 9.13497 1.00003 9.1212C0.999836 8.91776 0.999669 8.73838 1.0415 8.56416C1.07824 8.4111 1.13885 8.26479 1.22109 8.13058C1.31471 7.97781 1.44166 7.85109 1.58566 7.70736C1.5954 7.69764 1.60523 7.68783 1.61513 7.67793L7.89651 1.39656Z" fill="#6B7280" />
    </svg>
  )
}

const IconWrapper: FC<{ children: React.ReactNode | string }> = ({ children }) => {
  return (
    <div className="rounded-lg h-6 w-6 flex items-center justify-center hover:bg-gray-100">
      {children}
    </div>
  )
}

const THINK_BLOCK_REGEX = /<think>([\s\S]*?)(?:<\/think>|$)/gi

const splitThinkContent = (content: string) => {
  const thoughts: string[] = []
  const answer = content.replace(THINK_BLOCK_REGEX, (_match, thought) => {
    if (thought?.trim()) { thoughts.push(thought.trim()) }
    return ''
  }).trim()

  return {
    thought: thoughts.join('\n\n'),
    answer,
  }
}

const CollapsibleThought: FC<{ content: string, isResponding?: boolean, title?: string }> = ({
  content,
  isResponding,
  title,
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(!!isResponding)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startedAtRef = useRef<number | null>(null)
  const thoughtScrollRef = useRef<HTMLDivElement>(null)
  const hasThoughtContent = !!content?.trim()
  const panelMaxHeight = isResponding ? 'max-h-[180px]' : 'max-h-[360px]'

  useEffect(() => {
    setIsOpen(!!isResponding)
  }, [isResponding])

  useEffect(() => {
    if (!hasThoughtContent) {
      startedAtRef.current = null
      setElapsedSeconds(0)
      return
    }

    if (!startedAtRef.current) {
      startedAtRef.current = Date.now()
      setElapsedSeconds(0)
    }

    const updateElapsed = () => {
      if (!startedAtRef.current) { return }
      setElapsedSeconds(Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)))
    }

    if (!isResponding) {
      updateElapsed()
      return
    }

    const timer = window.setInterval(updateElapsed, 1000)

    return () => {
      window.clearInterval(timer)
      updateElapsed()
    }
  }, [hasThoughtContent, isResponding])

  useEffect(() => {
    if (!isResponding || !isOpen || !thoughtScrollRef.current) { return }

    requestAnimationFrame(() => {
      if (!thoughtScrollRef.current) { return }
      thoughtScrollRef.current.scrollTop = thoughtScrollRef.current.scrollHeight
    })
  }, [content, isOpen, isResponding])

  if (!hasThoughtContent) { return null }

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white/70">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-medium text-gray-600 hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${isResponding ? 'animate-pulse bg-primary-600' : 'bg-green-800'}`} />
          <span className="truncate">{title || (isResponding ? t('tools.thought.thinking') : t('tools.thought.thoughtProcess'))}</span>
          <span className="flex-shrink-0 text-gray-400">{elapsedSeconds}s</span>
        </span>
        <ChevronDownIcon className={`${isOpen ? 'rotate-180' : ''} h-4 w-4 flex-shrink-0 text-gray-400 transition-transform`} />
      </button>
      {isOpen && (
        <div ref={thoughtScrollRef} className={`${panelMaxHeight} overflow-y-auto border-t border-gray-100 px-3 py-2 text-xs leading-5 text-gray-600`}>
          <StreamdownMarkdown content={content} />
        </div>
      )}
    </div>
  )
}

const ResponseSpeedStatus: FC<{ item: ChatItem, isResponding?: boolean, hasVisibleContent: boolean }> = ({
  item,
  isResponding,
  hasVisibleContent,
}) => {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())
  const meta = item.responseMeta
  const metaStatus = meta?.status

  useEffect(() => {
    if (!metaStatus || metaStatus === 'completed') { return }

    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [metaStatus])

  if (!meta) { return null }

  const firstTokenSeconds = meta.firstTokenAt
    ? Math.max(1, Math.ceil((meta.firstTokenAt - meta.startedAt) / 1000))
    : Math.max(1, Math.ceil((now - meta.startedAt) / 1000))
  const totalSeconds = meta.completedAt
    ? Math.max(1, Math.ceil((meta.completedAt - meta.startedAt) / 1000))
    : Math.max(1, Math.ceil((now - meta.startedAt) / 1000))
  const waitStage = firstTokenSeconds < 2
    ? t('app.chat.responseStageUnderstanding')
    : firstTokenSeconds < 4
      ? t('app.chat.responseStageContext')
      : t('app.chat.responseStageComposing')

  if (!hasVisibleContent && isResponding) {
    return (
      <div className='min-w-[220px] space-y-3'>
        <div className='flex items-center gap-2 text-xs font-medium text-primary-600'>
          <span className='h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse' />
          <span>{waitStage}</span>
          <span className='text-gray-400'>{firstTokenSeconds}s</span>
        </div>
        <div className='space-y-2'>
          <div className='h-2.5 w-[92%] overflow-hidden rounded-full bg-gray-100'>
            <div className='h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-gray-100 via-primary-100 to-gray-100' />
          </div>
          <div className='h-2.5 w-[72%] overflow-hidden rounded-full bg-gray-100'>
            <div className='h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-gray-100 via-primary-100 to-gray-100' />
          </div>
          <div className='h-2.5 w-[46%] overflow-hidden rounded-full bg-gray-100'>
            <div className='h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-gray-100 via-primary-100 to-gray-100' />
          </div>
        </div>
      </div>
    )
  }

  if (meta.status === 'stopped') {
    return (
      <div className='mt-3 flex items-center gap-2 text-xs text-gray-400'>
        <span className='h-1.5 w-1.5 rounded-full bg-gray-400' />
        <span>{t('app.chat.responseStopped')} · {totalSeconds}s</span>
      </div>
    )
  }

  if (meta.status === 'completed') {
    return (
      <div className='mt-3 flex items-center gap-2 text-xs text-gray-400'>
        <span className='h-1.5 w-1.5 rounded-full bg-green-800' />
        <span>{t('app.chat.responseCompleted')} · {totalSeconds}s</span>
      </div>
    )
  }

  if (isResponding && hasVisibleContent) {
    return (
      <div className='mb-2 flex items-center gap-2 text-xs text-gray-400'>
        <span className='h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse' />
        <span>{t('app.chat.responseStreaming')} · {t('app.chat.firstTokenIn')} {firstTokenSeconds}s</span>
      </div>
    )
  }

  return null
}

interface IAnswerProps {
  item: ChatItem
  feedbackDisabled: boolean
  onFeedback?: FeedbackFunc
  onRetry?: () => void
  isResponding?: boolean
  allToolIcons?: Record<string, string | Emoji>
  suggestionClick?: (suggestion: string) => void
  canRetry?: boolean
}

// The component needs to maintain its own state to control whether to display input component
const Answer: FC<IAnswerProps> = ({
  item,
  feedbackDisabled = false,
  onFeedback,
  onRetry,
  isResponding,
  allToolIcons,
  suggestionClick = () => { },
  canRetry = false,
}) => {
  const { id, content, feedback, agent_thoughts, workflowProcess, suggestedQuestions = [] } = item
  const isAgentMode = !!agent_thoughts && agent_thoughts.length > 0

  const { t } = useTranslation()
  const [isCopied, setIsCopied] = useState(false)
  const contentWithThink = useMemo(() => splitThinkContent(content), [content])
  const hasVisibleContent = isAgentMode
    ? (agent_thoughts || []).some(item => !!item.thought || !!item.tool || (item.message_files || []).some(file => file.type === 'image' && file.belongs_to === 'assistant'))
    : !!(contentWithThink.thought || contentWithThink.answer || content)
  const copyContent = useMemo(() => {
    const visibleContent = contentWithThink.thought ? contentWithThink.answer : content

    if (visibleContent?.trim()) { return visibleContent.trim() }

    return (agent_thoughts || [])
      .map(item => splitThinkContent(item.thought || '').answer || (!item.tool ? item.thought : ''))
      .filter(item => !!item?.trim())
      .join('\n\n')
      .trim()
  }, [agent_thoughts, content, contentWithThink])

  useEffect(() => {
    setIsCopied(false)
  }, [copyContent])

  /**
   * Render feedback results (distinguish between users and administrators)
   * User reviews cannot be cancelled in Console
   * @param rating feedback result
   * @param isUserFeedback Whether it is user's feedback
   * @returns comp
   */
  const renderFeedbackRating = (rating: MessageRating | undefined) => {
    if (!rating) { return null }

    const isLike = rating === 'like'
    const ratingIconClassname = isLike ? 'text-primary-600 bg-primary-100 hover:bg-primary-200' : 'text-red-600 bg-red-100 hover:bg-red-200'
    // The tooltip is always displayed, but the content is different for different scenarios.
    return (
      <Tooltip
        selector={`user-feedback-${randomString(16)}`}
        content={isLike ? '取消赞同' : '取消反对'}
      >
        <div
          className="relative box-border flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          onClick={async () => {
            await onFeedback?.(id, { rating: null })
          }}
        >
          <div className={`${ratingIconClassname} rounded-lg h-6 w-6 flex items-center justify-center`}>
            <RatingIcon isLike={isLike} />
          </div>
        </div>
      </Tooltip>
    )
  }

  /**
   * Different scenarios have different operation items.
   * @returns comp
   */
  const renderItemOperation = () => {
    const userOperation = () => {
      return feedback?.rating
        ? null
        : (
          <div className="flex gap-1">
            <Tooltip selector={`user-feedback-${randomString(16)}`} content={t('common.operation.like') as string}>
              {OperationBtn({ innerContent: <IconWrapper><RatingIcon isLike={true} /></IconWrapper>, onClick: () => onFeedback?.(id, { rating: 'like' }) })}
            </Tooltip>
            <Tooltip selector={`user-feedback-${randomString(16)}`} content={t('common.operation.dislike') as string}>
              {OperationBtn({ innerContent: <IconWrapper><RatingIcon isLike={false} /></IconWrapper>, onClick: () => onFeedback?.(id, { rating: 'dislike' }) })}
            </Tooltip>
          </div>
        )
    }

    return (
      <div className={`${s.itemOperation} flex items-center gap-1`}>
        {!!copyContent && (
          <Tooltip selector={`copy-answer-${randomString(16)}`} content={t(isCopied ? 'common.operation.copied' : 'common.operation.copy') as string}>
            {OperationBtn({
              innerContent: isCopied
                ? <ClipboardCheck className='h-4 w-4 text-primary-600' />
                : <Clipboard className='h-4 w-4' />,
              onClick: () => {
                copy(copyContent)
                setIsCopied(true)
              },
            })}
          </Tooltip>
        )}
        {canRetry && !isResponding && (
          <Tooltip selector={`retry-answer-${randomString(16)}`} content={t('common.operation.retry') as string}>
            {OperationBtn({
              innerContent: <RefreshCcw01 className='h-4 w-4' />,
              onClick: onRetry,
            })}
          </Tooltip>
        )}
        {userOperation()}
        {!feedbackDisabled && renderFeedbackRating(feedback?.rating)}
      </div>
    )
  }

  const getImgs = (list?: VisionFile[]) => {
    if (!list) { return [] }
    return list.filter(file => file.type === 'image' && file.belongs_to === 'assistant')
  }

  const renderThoughtContent = (thoughtContent: string, hasTool: boolean) => {
    const parsed = splitThinkContent(thoughtContent)
    const visibleAnswer = parsed.thought ? parsed.answer : thoughtContent

    return (
      <>
        <CollapsibleThought content={parsed.thought || (hasTool ? thoughtContent : '')} isResponding={isResponding} />
        {visibleAnswer && !hasTool && (
          <StreamdownMarkdown content={visibleAnswer} />
        )}
      </>
    )
  }

  const agentModeAnswer = (
    <div>
      {agent_thoughts?.map((item, index) => (
        <div key={index}>
          {item.thought && (
            renderThoughtContent(item.thought, !!item.tool)
          )}
          {/* {item.tool} */}
          {/* perhaps not use tool */}
          {!!item.tool && (
            <Thought
              thought={item}
              allToolIcons={allToolIcons || {}}
              isFinished={!!item.observation || !isResponding}
            />
          )}

          {getImgs(item.message_files).length > 0 && (
            <ImageGallery srcs={getImgs(item.message_files).map(item => item.url)} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div key={id}>
      <div className="flex items-start">
        <div className={`${s.answerIcon} h-8 w-8 shrink-0 rounded-full shadow-sm tablet:h-10 tablet:w-10`}>
          {isResponding
            && (
              <div className={s.typeingIcon}>
                <LoadingAnim type="avatar" />
              </div>
            )}
        </div>
        <div className={`${s.answerWrap} min-w-0 max-w-[84%] tablet:max-w-[calc(100%-3rem)]`}>
          <div className={`${s.answer} relative text-sm text-gray-900`}>
            <div className={`ml-2 rounded-[18px] rounded-tl-md border border-gray-200 bg-white px-4 py-3 leading-6 shadow-sm ${workflowProcess && 'tablet:min-w-[480px]'}`}>
              {workflowProcess && (
                <WorkflowProcess data={workflowProcess} hideInfo />
              )}
              {(isResponding && (isAgentMode ? (!content && (agent_thoughts || []).filter(item => !!item.thought || !!item.tool).length === 0) : !content))
                ? (
                  <ResponseSpeedStatus item={item} isResponding={isResponding} hasVisibleContent={false} />
                )
                : (
                  <>
                    {isResponding && (
                      <ResponseSpeedStatus item={item} isResponding={isResponding} hasVisibleContent={hasVisibleContent} />
                    )}
                    {isAgentMode
                      ? agentModeAnswer
                      : (
                        <>
                          <CollapsibleThought content={contentWithThink.thought} isResponding={isResponding} />
                          {(contentWithThink.thought ? contentWithThink.answer : content) && (
                            <StreamdownMarkdown content={contentWithThink.thought ? contentWithThink.answer : content} />
                          )}
                        </>
                      )}
                    {!isResponding && (
                      <ResponseSpeedStatus item={item} isResponding={false} hasVisibleContent={hasVisibleContent} />
                    )}
                  </>
                )}
              {suggestedQuestions.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {suggestedQuestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <Button className="text-sm" type="link" onClick={() => suggestionClick(suggestion)}>{suggestion}</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className='ml-2 mt-2 flex min-h-7 items-center'>
            {!feedbackDisabled && !item.feedbackDisabled && renderItemOperation()}
            {item.feedbackDisabled && !feedbackDisabled && renderFeedbackRating(feedback?.rating)}
          </div>
        </div>
      </div>
    </div>
  )
}

const areAnswerPropsEqual = (prev: IAnswerProps, next: IAnswerProps) => {
  return prev.item === next.item
    && prev.feedbackDisabled === next.feedbackDisabled
    && prev.isResponding === next.isResponding
    && prev.canRetry === next.canRetry
    && prev.allToolIcons === next.allToolIcons
}

export default React.memo(Answer, areAnswerPropsEqual)
