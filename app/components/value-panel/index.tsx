'use client'
import type { FC, ReactNode } from 'react'
import React from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import s from './style.module.css'
import { StarIcon } from '@/app/components//welcome/massive-component'
import Button from '@/app/components/base/button'

export interface ITemplateVarPanelProps {
  className?: string
  header: ReactNode
  children?: ReactNode | null
  isFold: boolean
}

const TemplateVarPanel: FC<ITemplateVarPanelProps> = ({
  className,
  header,
  children,
  isFold,
}) => {
  return (
    <div className={cn(isFold ? 'border border-gray-200' : s.boxShodow, className, 'overflow-hidden rounded-xl border border-gray-200 bg-white/95')}>
      {/* header */}
      <div
        className={cn('px-6 py-5 text-xs', isFold ? 'bg-white' : 'border-b border-gray-100 bg-gradient-to-br from-white to-gray-50')}
      >
        {header}
      </div>
      {/* body */}
      {!isFold && children && (
        <div className='p-6'>
          {children}
        </div>
      )}
    </div>
  )
}

export const PanelTitle: FC<{ title: string, className?: string }> = ({
  title,
  className,
}) => {
  return (
    <div className={cn(className, 'flex items-center space-x-1 text-primary-600')}>
      <StarIcon />
      <span className='text-xs'>{title}</span>
    </div>
  )
}

export const VarOpBtnGroup: FC<{ className?: string, onConfirm: () => void, onCancel: () => void }> = ({
  className,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation()

  return (
    <div className={cn(className, 'flex mt-3 space-x-2 mobile:ml-0 tablet:ml-[128px] text-sm')}>
      <Button
        className='text-sm'
        type='primary'
        onClick={onConfirm}
      >
        {t('common.operation.save')}
      </Button>
      <Button
        className='text-sm'
        onClick={onCancel}
      >
        {t('common.operation.cancel')}
      </Button>
    </div >
  )
}

export default React.memo(TemplateVarPanel)
