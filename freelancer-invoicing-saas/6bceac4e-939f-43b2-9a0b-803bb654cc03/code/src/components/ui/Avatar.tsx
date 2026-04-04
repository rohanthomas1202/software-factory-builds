import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-14 w-14",
        "2xl": "h-16 w-16",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const avatarImageVariants = cva(
  "aspect-square h-full w-full",
  {
    variants: {
      size: {
        xs: "text-[8px]",
        sm: "text-[10px]",
        md: "text-xs",
        lg: "text-sm",
        xl: "text-base",
        "2xl": "text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const avatarFallbackVariants = cva(
  "flex h-full w-full items-center justify-center bg-muted font-medium text-muted-foreground",
  {
    variants: {
      size: {
        xs: "text-[8px]",
        sm: "text-[10px]",
        md: "text-xs",
        lg: "text-sm",
        xl: "text-base",
        "2xl": "text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, children, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)
    const showFallback = !src || imageError

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {!showFallback && (
          <img
            src={src}
            alt={alt || "Avatar"}
            className={cn(avatarImageVariants({ size }), "object-cover")}
            onError={() => setImageError(true)}
          />
        )}
        {showFallback && (
          <div className={cn(avatarFallbackVariants({ size }), "rounded-full")}>
            {fallback ? getInitials(fallback) : children || "?"}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: VariantProps<typeof avatarImageVariants>["size"]
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, size, ...props }, ref) => (
    <img
      ref={ref}
      className={cn(avatarImageVariants({ size }), className)}
      {...props}
    />
  )
)
AvatarImage.displayName = "AvatarImage"

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: VariantProps<typeof avatarFallbackVariants>["size"]
  children: React.ReactNode
}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, size, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(avatarFallbackVariants({ size }), className)}
      {...props}
    >
      {children}
    </div>
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }