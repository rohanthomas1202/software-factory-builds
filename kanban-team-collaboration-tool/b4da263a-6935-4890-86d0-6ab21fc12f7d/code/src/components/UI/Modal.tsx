'use client';

import { cn } from '@/lib/utils';
import { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button, ButtonProps } from './Button';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  preventCloseOnBackdrop?: boolean;
  footer?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: ButtonProps['variant'];
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: ButtonProps['variant'];
  };
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      size = 'md',
      showCloseButton = true,
      preventCloseOnBackdrop = false,
      footer,
      primaryAction,
      secondaryAction,
      className,
      overlayClassName,
      contentClassName,
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      const handleClickOutside = (e: MouseEvent) => {
        if (
          modalRef.current &&
          !modalRef.current.contains(e.target as Node) &&
          !preventCloseOnBackdrop &&
          isOpen
        ) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);

      if (isOpen) {
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onClose, preventCloseOnBackdrop]);

    if (!isOpen) return null;

    const modalContent = (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          overlayClassName
        )}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          ref={modalRef}
          className={cn(
            'relative z-50 w-full rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden',
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          {(title || description || showCloseButton) && (
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {title && (
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClose}
                    className="ml-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className={cn('px-6 py-4', contentClassName)}>{children}</div>

          {/* Footer */}
          {(footer || primaryAction || secondaryAction) && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50">
              {footer ? (
                footer
              ) : (
                <div className="flex items-center justify-end gap-3">
                  {secondaryAction && (
                    <Button
                      variant={secondaryAction.variant || 'outline'}
                      onClick={secondaryAction.onClick}
                      loading={secondaryAction.loading}
                      disabled={secondaryAction.disabled}
                    >
                      {secondaryAction.label}
                    </Button>
                  )}
                  {primaryAction && (
                    <Button
                      variant={primaryAction.variant || 'default'}
                      onClick={primaryAction.onClick}
                      loading={primaryAction.loading}
                      disabled={primaryAction.disabled}
                    >
                      {primaryAction.label}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';