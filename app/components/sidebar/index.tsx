import React from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisSolidIcon } from '@heroicons/react/24/solid'
import Button from '@/app/components/base/button'
// import Card from './card'
import type { ConversationItem } from '@/types/app'

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

export interface ISidebarProps {
  copyRight: string
  currentId: string
  onCurrentIdChange: (id: string) => void
  onDeleteConversation: (id: string) => void
  list: ConversationItem[]
}

const Sidebar: FC<ISidebarProps> = ({
  copyRight,
  currentId,
  onCurrentIdChange,
  onDeleteConversation,
  list,
}) => {
  const { t } = useTranslation()
  return (
    <div
      className="shrink-0 flex flex-col bg-white/95 backdrop-blur pc:w-[256px] tablet:w-[208px] mobile:w-[286px] border-r border-gray-200 tablet:h-[calc(100vh_-_3rem)] mobile:h-screen mobile:pt-[env(safe-area-inset-top)]"
    >
      <div className="flex flex-shrink-0 p-4 !pb-0">
        <Button
          onClick={() => { onCurrentIdChange('-1') }}
          className="group block w-full flex-shrink-0 !justify-start !h-10 items-center text-sm font-medium text-primary-600 shadow-sm"
        >
          <PencilSquareIcon className="mr-2 h-4 w-4" /> {t('app.chat.newChat')}
        </Button>
      </div>

      <nav className="mt-4 flex-1 min-h-0 space-y-1 p-4 !pt-0 overflow-y-auto">
        {list.map((item) => {
          const isCurrent = item.id === currentId
          const canDelete = item.id !== '-1'
          const ItemIcon
            = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
          return (
            <div
              onClick={() => onCurrentIdChange(item.id)}
              key={item.id}
              className={classNames(
                isCurrent
                  ? 'bg-primary-50 text-primary-700 shadow-[inset_0_0_0_1px_rgba(28,100,242,0.10)]'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                'group flex items-center rounded-lg px-2.5 py-2.5 text-sm font-medium cursor-pointer transition',
              )}
            >
              <ItemIcon
                className={classNames(
                  isCurrent
                    ? 'text-primary-600'
                    : 'text-gray-400 group-hover:text-gray-500',
                  'mr-3 h-[18px] w-[18px] flex-shrink-0',
                )}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
              {canDelete && (
                <button
                  type="button"
                  className={classNames(
                    isCurrent ? 'opacity-100' : 'mobile:opacity-100 tablet:opacity-0 tablet:group-hover:opacity-100',
                    'ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600',
                  )}
                  title={t('common.operation.delete') as string}
                  aria-label={t('common.operation.delete') as string}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(item.id)
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        })}
      </nav>
      {/* <a className="flex flex-shrink-0 p-4" href="https://langgenius.ai/" target="_blank">
        <Card><div className="flex flex-row items-center"><ChatBubbleOvalLeftEllipsisSolidIcon className="text-primary-600 h-6 w-6 mr-2" /><span>LangGenius</span></div></Card>
      </a> */}
      <div className="flex flex-shrink-0 pr-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pl-4">
        <div className="text-gray-400 font-normal text-xs">© {copyRight} {(new Date()).getFullYear()}</div>
      </div>
    </div>
  )
}

export default React.memo(Sidebar)
