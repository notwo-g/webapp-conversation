'use client'
import type { FC } from 'react'
import React, { useCallback, useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'

export interface IChatProps {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  onStop?: () => void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  scrollContainerRef?: React.RefObject<HTMLDivElement>
  onInputHeightChange?: (height: number) => void
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  onStop = () => { },
  useCurrentUserAvatar,
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
  scrollContainerRef,
  onInputHeightChange,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)
  const scrollBottomRef = useRef<HTMLDivElement>(null)
  const inputAreaRef = useRef<HTMLDivElement>(null)

  // auto-scroll to latest content during streaming
  useEffect(() => {
    if (isResponding && scrollContainerRef?.current) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      })
    }
  }, [chatList, isResponding, scrollContainerRef])

  useEffect(() => {
    if (isHideSendInput) {
      onInputHeightChange?.(0)
      return
    }

    const inputArea = inputAreaRef.current
    if (!inputArea || !onInputHeightChange) { return }

    const reportHeight = () => {
      onInputHeightChange(inputArea.getBoundingClientRect().height)
    }

    reportHeight()

    if (typeof ResizeObserver === 'undefined') { return }

    const observer = new ResizeObserver(reportHeight)
    observer.observe(inputArea)

    return () => observer.disconnect()
  }, [isHideSendInput, onInputHeightChange])

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = useCallback((message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }, [notify])

  const valid = useCallback(() => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }, [logError, t])

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])
  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  const handleSend = useCallback(() => {
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const hasPendingImageUploads = files.some(file => file.progress !== -1 && file.progress < 100)
    const hasPendingAttachmentUploads = attachmentFiles.some(file => file.progress !== -1 && file.progress < 100)
    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }, [attachmentFiles, checkCanSend, files, isResponding, logError, onClear, onSend, valid, t])
  const handleSendRef = useRef(handleSend)

  useEffect(() => {
    handleSendRef.current = handleSend
  }, [handleSend])

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current && !isResponding) { handleSend() }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSendRef.current()
  }, [])

  const handleRetry = useCallback((question: ChatItem) => {
    if (isResponding) {
      logError(t('app.errorMessage.waitForResponse'))
      return
    }
    if (checkCanSend && !checkCanSend()) { return }

    onSend(question.content, question.message_files || [])
  }, [checkCanSend, isResponding, logError, onSend, t])
  const handleRetryRef = useRef(handleRetry)

  useEffect(() => {
    handleRetryRef.current = handleRetry
  }, [handleRetry])

  return (
    <div className={cn(!feedbackDisabled && 'mobile:px-3 tablet:px-3.5', 'min-h-full')}>
      {/* Chat List */}
      <div className="min-h-full mobile:space-y-5 tablet:space-y-[30px] mobile:pt-4 tablet:pt-0">
        {chatList.map((item, index) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            const previousQuestion = chatList
              .slice(0, index)
              .reverse()
              .find(item => !item.isAnswer)
            return <Answer
              key={item.id}
              item={item}
              feedbackDisabled={feedbackDisabled}
              onFeedback={onFeedback}
              onRetry={previousQuestion ? () => handleRetryRef.current(previousQuestion) : undefined}
              canRetry={!!previousQuestion && !item.feedbackDisabled && !isResponding}
              isResponding={isResponding && isLast}
              suggestionClick={suggestionClick}
            />
          }
          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              useCurrentUserAvatar={useCurrentUserAvatar}
              imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
            />
          )
        })}
        {/* scroll anchor — always scroll to this during streaming */}
        <div ref={scrollBottomRef} className="h-[1px] w-full" />
      </div>
      {
        !isHideSendInput && (
          <div ref={inputAreaRef} className='fixed z-20 bottom-0 left-1/2 transform -translate-x-1/2 pc:ml-[122px] tablet:ml-[96px] mobile:ml-0 pc:w-[794px] tablet:w-[794px] max-w-full mobile:w-full mobile:px-3 tablet:px-3.5 mobile:pb-[calc(env(safe-area-inset-bottom)+10px)] tablet:pb-5'>
            <div className='rounded-2xl border border-gray-200 bg-white/95 shadow-[0_18px_42px_rgba(15,23,42,0.16)] backdrop-blur'>
              <div className='max-h-[178px] overflow-y-auto rounded-2xl'>
                {
                  visionConfig?.enabled && (
                    <div className='pl-3 pt-3'>
                      <ImageList
                        list={files}
                        onRemove={onRemove}
                        onReUpload={onReUpload}
                        onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                        onImageLinkLoadError={onImageLinkLoadError}
                      />
                    </div>
                  )
                }
                {
                  fileConfig?.enabled && (
                    <div className='px-3 pt-2'>
                      <FileUploaderInAttachmentWrapper
                        fileConfig={fileConfig}
                        value={attachmentFiles}
                        onChange={setAttachmentFiles}
                      />
                    </div>
                  )
                }
                <Textarea
                  className={`
                    block w-full min-h-11 px-4 py-3 leading-5 max-h-none text-[15px] text-gray-800 outline-none appearance-none resize-none placeholder:text-gray-400
                  `}
                  value={query}
                  onChange={handleContentChange}
                  onKeyUp={handleKeyUp}
                  onKeyDown={handleKeyDown}
                  autoSize
                />
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-100/60">
                <div className='flex items-center'>
                  {visionConfig?.enabled && (
                    <>
                      <ChatImageUploader
                        settings={visionConfig}
                        onUpload={onUpload}
                        disabled={files.length >= visionConfig.number_limits}
                      />
                      <div className='mx-1 w-[1px] h-4 bg-black/5' />
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  <div className={`${s.count} mr-2 h-5 leading-5 text-xs bg-gray-50 text-gray-400 px-2 rounded-full mobile:hidden tablet:block`}>{query.trim().length}</div>
                  <Tooltip
                    selector='send-tip'
                    htmlContent={
                      isResponding
                        ? <div>{t('common.operation.stop')}</div>
                        : (
                          <div>
                            <div>{t('common.operation.send')} Enter</div>
                            <div>{t('common.operation.lineBreak')} Shift Enter</div>
                          </div>
                        )
                    }
                  >
                    <button
                      type="button"
                      className={`${isResponding ? s.stopBtn : s.sendBtn} h-8 w-8 cursor-pointer rounded-full`}
                      aria-label={t(isResponding ? 'common.operation.stop' : 'common.operation.send') as string}
                      onClick={isResponding ? onStop : handleSend}
                    ></button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
