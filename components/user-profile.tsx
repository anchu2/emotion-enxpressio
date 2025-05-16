"use client"
import { useAuth } from "@/contexts/auth-context"
import { usePayment } from "@/contexts/payment-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, CreditCard } from "lucide-react"

export function UserProfile() {
  const { user, signOut, checkPremiumAccess } = useAuth()
  const { setShowPaymentModal } = usePayment()
  const isPremium = user ? checkPremiumAccess() : false

  const handleSignOut = async () => {
    await signOut()
  }

  const handleUpgrade = () => {
    setShowPaymentModal(true)
  }

  // 사용자가 로그인하지 않은 경우
  if (!user) {
    return null
  }

  // 사용자 이름의 첫 글자 가져오기
  const getInitials = () => {
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase()
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "사용자"} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          {isPremium && (
            <span className="absolute -top-1 -right-1">
              <Badge
                variant="outline"
                className="bg-yellow-500 text-white border-yellow-500 h-5 w-5 p-0 flex items-center justify-center rounded-full"
              >
                <span className="sr-only">프리미엄 사용자</span>✨
              </Badge>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center">
          <User className="mr-2 h-4 w-4" />
          <span>내 프로필</span>
        </DropdownMenuItem>
        {!isPremium && (
          <DropdownMenuItem onClick={handleUpgrade} className="flex items-center text-yellow-600 dark:text-yellow-400">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>프리미엄으로 업그레이드</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
