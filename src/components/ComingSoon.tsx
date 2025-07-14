'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface ComingSoonProps {
  children: React.ReactNode
  title?: string
  description?: string
  variant?: 'button' | 'link' | 'dialog'
}

export function ComingSoon({ 
  children, 
  title = "Coming Soon", 
  description = "This feature is under development and will be available soon.",
  variant = 'dialog'
}: ComingSoonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const content = (
    <div className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span>In Development</span>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  )

  if (variant === 'dialog') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div onClick={() => setIsOpen(true)}>
            {children}
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  if (variant === 'button') {
    return (
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        {children}
      </Button>
    )
  }

  return (
    <div onClick={() => setIsOpen(true)} className="cursor-pointer">
      {children}
    </div>
  )
}

// Standalone Coming Soon page component
export function ComingSoonPage({ 
  title = "Coming Soon",
  description = "This page is under development and will be available soon. We're working hard to bring you the best experience."
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>In Development</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Utility function to wrap any button or link with Coming Soon functionality
export function withComingSoon<P extends object>(
  Component: React.ComponentType<P>,
  title?: string,
  description?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <ComingSoon title={title} description={description}>
        <Component {...props} />
      </ComingSoon>
    )
  }
}

// Pre-configured Coming Soon components for common use cases
export const ComingSoonButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
  <ComingSoon>
    <Button {...props}>{children}</Button>
  </ComingSoon>
)

export const ComingSoonLink = ({ children, href, ...props }: React.ComponentProps<'a'>) => (
  <ComingSoon>
    <a href={href} {...props}>{children}</a>
  </ComingSoon>
) 