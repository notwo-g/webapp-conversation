'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'
import s from '../style.module.css'

import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'id' | 'content' | 'useCurrentUserAvatar'> & {
  imgSrcs?: string[]
}

const Question: FC<IQuestionProps> = ({ id, content, useCurrentUserAvatar, imgSrcs }) => {
  const userName = ''
  return (
    <div className='flex items-start justify-end' key={id}>
      <div className='min-w-0 max-w-[82%] tablet:max-w-[78%]'>
        <div className={`${s.question} relative text-sm text-gray-900`}>
          <div
            className={'mr-2 rounded-[18px] rounded-tr-md bg-primary-600 px-4 py-3 text-white shadow-sm'}
          >
            {imgSrcs && imgSrcs.length > 0 && (
              <ImageGallery srcs={imgSrcs} />
            )}
            <StreamdownMarkdown content={content} />
          </div>
        </div>
      </div>
      {useCurrentUserAvatar
        ? (
          <div className='mr-1 h-8 w-8 shrink-0 rounded-full bg-primary-600 text-center text-sm leading-8 text-white shadow-sm tablet:mr-2 tablet:h-10 tablet:w-10 tablet:leading-10'>
            {userName?.[0].toLocaleUpperCase()}
          </div>
        )
        : (
          <div className={`${s.questionIcon} mr-1 h-8 w-8 shrink-0 shadow-sm tablet:mr-0 tablet:h-10 tablet:w-10`}></div>
        )}
    </div>
  )
}

const areQuestionPropsEqual = (prev: IQuestionProps, next: IQuestionProps) => {
  return prev.id === next.id
    && prev.content === next.content
    && prev.useCurrentUserAvatar === next.useCurrentUserAvatar
    && (prev.imgSrcs || []).length === (next.imgSrcs || []).length
    && (prev.imgSrcs || []).every((src, index) => src === (next.imgSrcs || [])[index])
}

export default React.memo(Question, areQuestionPropsEqual)
