import type { FC } from 'react'
import React from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'
export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
}) => {
  return (
    <div className="shrink-0 border-b border-white/70 bg-[#F7F8FB]/95 backdrop-blur mobile:pt-[env(safe-area-inset-top)]">
      <div className="relative flex h-12 items-center justify-between px-3">
        {isMobile
          ? (
            <div
              className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm active:scale-95'
              onClick={() => onShowSideBar?.()}
            >
              <Bars3Icon className="h-4 w-4" />
            </div>
          )
          : <div></div>}
        <div className='absolute left-1/2 flex max-w-[calc(100%-112px)] -translate-x-1/2 items-center space-x-2'>
          <AppIcon size="tiny" className='shadow-sm' />
          <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
        </div>
        {isMobile
          ? (
            <div className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm active:scale-95' onClick={() => onCreateNewChat?.()} >
              <PencilSquareIcon className="h-4 w-4" />
            </div>)
          : <div></div>}
      </div>
    </div>
  )
}

export default React.memo(Header)
