"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { usePayment } from "@/contexts/payment-context"
import { Check, CreditCard, Sparkles } from "lucide-react"

export function PaymentModal() {
  const { showPaymentModal, setShowPaymentModal, processPremiumSubscription, isProcessing } = usePayment()

  const handlePayment = async () => {
    await processPremiumSubscription()
  }

  return (
    <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span>프리미엄 구독</span>
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </DialogTitle>
          <DialogDescription>프리미엄 구독으로 모든 기능을 이용해보세요.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-medium text-lg mb-2">프리미엄 혜택</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>모든 감정 강도 모드 이용 가능</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>음성 출력 기능 무제한 이용</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>히스토리 무제한 저장</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>광고 없는 깔끔한 환경</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border p-4 bg-primary/5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">월 구독료</h3>
              <span className="text-xl font-bold">₩9,900</span>
            </div>
            <p className="text-sm text-muted-foreground">언제든지 해지 가능, 첫 7일 무료 체험</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
            취소
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                처리 중...
              </span>
            ) : (
              <span className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                결제하기
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
