"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export function LoginModal({ isOpen, onClose, message }: LoginModalProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signInWithGoogle, signInWithKakao, authError } = useAuth()

  // 카카오 SDK 로드
  useEffect(() => {
    const loadKakaoSDK = () => {
      const script = document.createElement("script")
      script.src = "https://developers.kakao.com/sdk/js/kakao.js"
      script.async = true
      script.onload = () => {
        console.log("카카오 SDK 로드 완료")
      }
      document.head.appendChild(script)
    }

    if (!window.Kakao) {
      loadKakaoSDK()
    }
  }, [])

  // authError가 변경되면 error 상태 업데이트
  useEffect(() => {
    if (authError) {
      setError(authError)
    }
  }, [authError])

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      console.log("로그인 모달: 구글 로그인 시도")
      await signInWithGoogle()
      console.log("로그인 모달: 로그인 성공")
      onClose()
    } catch (error: any) {
      console.error("로그인 모달: 로그인 오류", error)
      setError(error.message || "로그인 중 오류가 발생했습니다.")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true)
    setError(null)

    try {
      console.log("로그인 모달: 카카오 로그인 시도")
      await signInWithKakao()
      console.log("로그인 모달: 카카오 로그인 성공")
      onClose()
    } catch (error: any) {
      console.error("로그인 모달: 카카오 로그인 오류", error)
      setError(error.message || "카카오 로그인 중 오류가 발생했습니다.")
    } finally {
      setIsKakaoLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
          <DialogDescription>{message || "서비스를 이용하려면 로그인이 필요합니다."}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isKakaoLoading}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            variant="outline"
          >
            {isGoogleLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
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
                로그인 중...
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    fill="#EA4335"
                    d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
                  />
                </svg>
                구글로 로그인
              </>
            )}
          </Button>

          <Button
            onClick={handleKakaoLogin}
            disabled={isGoogleLoading || isKakaoLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] border-none"
          >
            {isKakaoLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#191919]"
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
                로그인 중...
              </span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 0.5C4.02944 0.5 0 3.69844 0 7.68989C0 10.1475 1.55983 12.3222 3.93304 13.5149C3.7513 14.0846 3.26336 15.9644 3.1872 16.3096C3.09485 16.7336 3.37483 16.7336 3.55657 16.6096C3.69799 16.5125 5.84586 15.0328 6.73176 14.4299C7.46657 14.5683 8.22539 14.6423 9 14.6423C13.9706 14.6423 18 11.4439 18 7.45242C18 3.46096 13.9706 0.5 9 0.5Z"
                    fill="#191919"
                  />
                </svg>
                카카오로 로그인
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <p className="mb-2">
            <strong>참고:</strong> 로그인이 작동하지 않는 경우 다음을 확인하세요:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>팝업 차단이 해제되어 있는지 확인하세요.</li>
            <li>개인정보 보호 모드나 시크릿 모드에서는 로그인이 제한될 수 있습니다.</li>
          </ul>
        </div>

        <DialogFooter className="text-xs text-muted-foreground text-center">
          로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
