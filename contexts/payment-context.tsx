"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"

interface PaymentContextType {
  isProcessing: boolean
  showPaymentModal: boolean
  setShowPaymentModal: (show: boolean) => void
  processPremiumSubscription: () => Promise<boolean>
}

const PaymentContext = createContext<PaymentContextType>({
  isProcessing: false,
  showPaymentModal: false,
  setShowPaymentModal: () => {},
  processPremiumSubscription: async () => false,
})

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // 가상의 결제 처리 함수
  const processPremiumSubscription = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "결제를 진행하려면 먼저 로그인해주세요.",
        variant: "destructive",
      })
      return false
    }

    setIsProcessing(true)

    try {
      // 실제 결제 처리 대신 타임아웃으로 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // 사용자 문서에 구독 정보 업데이트
      const userRef = doc(db, "users", user.uid)

      // 30일 후 만료 날짜 계산
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await updateDoc(userRef, {
        "subscription.isActive": true,
        "subscription.plan": "premium",
        "subscription.expiresAt": expiresAt.getTime(),
        "subscription.updatedAt": serverTimestamp(),
      })

      toast({
        title: "결제 성공",
        description: "프리미엄 구독이 활성화되었습니다.",
      })

      // 페이지 새로고침하여 사용자 정보 업데이트
      window.location.reload()

      return true
    } catch (error) {
      console.error("결제 처리 오류:", error)
      toast({
        title: "결제 실패",
        description: "결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsProcessing(false)
      setShowPaymentModal(false)
    }
  }

  return (
    <PaymentContext.Provider
      value={{
        isProcessing,
        showPaymentModal,
        setShowPaymentModal,
        processPremiumSubscription,
      }}
    >
      {children}
    </PaymentContext.Provider>
  )
}

export const usePayment = () => useContext(PaymentContext)
