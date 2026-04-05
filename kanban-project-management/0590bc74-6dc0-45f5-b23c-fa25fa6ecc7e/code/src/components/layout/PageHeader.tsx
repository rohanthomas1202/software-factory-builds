import { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, MoreVertical, Share2, Download, Filter, Plus, Settings } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'

interface PageHeaderProps {
  title: string
  description?: string
  backButton?: {
    label: string
    href: string
  }
  actions?: ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  className?: string
}

export function PageHeader({
  title,
  description,
  backButton,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-2 flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 dark:text-gray-300">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <ChevronLeft className="mx-2 h-4 w-4 rotate-180 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Back button */}
          {backButton && (
            <div className="mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={backButton.href}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {backButton.label}
                </Link>
              </Button>
            </div>
          )}

          {/* Title and description */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-4 flex items-center space-x-2">
          {actions}

          {/* Default actions dropdown */}
          <Dropdown
            trigger={
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            align="end"
          >
            <div className="w-48 p-2">
              <Dropdown.Item className="flex items-center">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Dropdown.Item>
              <Dropdown.Item className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Dropdown.Item>
              <Dropdown.Item className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Dropdown.Item>
              <Dropdown.Separator />
              <Dropdown.Item className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Dropdown.Item>
            </div>
          </Dropdown>
        </div>
      </div>
    </div>
  )
}