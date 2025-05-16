"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  UserCredential,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

// 사용자 구독 상태 타입
export interface UserSubscription {
  isActive: boolean
  plan: "free" | "premium"
  expiresAt: number | null
}

// 확장된 사용자 타입
export interface ExtendedUser extends User {
  subscription?: UserSubscription
}

// 인증 컨텍스트 타입
interface AuthContextType {
  user: ExtendedUser | null
  loading: boolean
  signInWithGoogle: () => Promise<UserCredential>
  signInWithKakao: () => Promise<UserCredential>
  signOut: () => Promise<void>
  checkPremiumAccess: () => boolean
  authError: string | null
}

// 기본값으로 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {
    throw new Error("Not implemented")
  },
  signInWithKakao: async () => {
    throw new Error("Not implemented")
  },
  signOut: async () => {},
  checkPremiumAccess: () => false,
  authError: null,
})

// 인증 컨텍스트 제공자 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  // 사용자 구독 정보 가져오기
  const fetchUserSubscription = async (user: User) => {
    try {
      // 먼저 로컬 스토리지에서 구독 정보 확인
      const cachedSubscription = localStorage.getItem(`subscription_${user.uid}`)
      if (cachedSubscription) {
        const parsedSubscription = JSON.parse(cachedSubscription)
        // 캐시된 구독 정보가 1시간 이내인 경우 사용
        if (Date.now() - parsedSubscription.timestamp < 3600000) {
          return parsedSubscription.data
        }
      }

      // 온라인 상태 확인
      const isOnline = navigator.onLine
      if (!isOnline) {
        console.log("오프라인 상태: 캐시된 구독 정보 사용")
        return cachedSubscription ? JSON.parse(cachedSubscription).data : null
      }

      const subscriptionDoc = await getDoc(doc(db, "subscriptions", user.uid))
      const subscriptionData = subscriptionDoc.data()

      // 구독 정보를 로컬 스토리지에 캐싱
      if (subscriptionData) {
        localStorage.setItem(
          `subscription_${user.uid}`,
          JSON.stringify({
            data: subscriptionData,
            timestamp: Date.now(),
          })
        )
      }

      return subscriptionData
    } catch (error) {
      console.error("구독 정보 가져오기 오류:", error)
      // 오류 발생 시 캐시된 데이터 사용
      const cachedSubscription = localStorage.getItem(`subscription_${user.uid}`)
      return cachedSubscription ? JSON.parse(cachedSubscription).data : null
    }
  }

  // 사용자 정보 저장
  const saveUserToFirestore = async (user: User, provider: string) => {
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: provider,
          lastLogin: new Date().toISOString(),
        },
        { merge: true },
      )
      console.log("사용자 정보 저장 완료")
    } catch (error) {
      console.error("사용자 정보 저장 오류:", error)
    }
  }

  // 구글 로그인 처리 - 팝업 방식
  const signInWithGoogle = async () => {
    try {
      setAuthError(null)
      console.log("구글 로그인 시도 중...")
      const provider = new GoogleAuthProvider()

      // 팝업 차단 문제 해결을 위한 설정
      provider.setCustomParameters({
        prompt: "select_account",
      })

      console.log("팝업 열기 시도...")
      const result = await signInWithPopup(auth, provider)
      console.log("로그인 성공:", result.user.displayName)

      // Firestore에 사용자 정보 저장
      await saveUserToFirestore(result.user, "google")

      return result
    } catch (error: any) {
      console.error("구글 로그인 오류:", error)

      // 사용자 친화적인 오류 메시지 설정
      if (error.code === "auth/popup-blocked") {
        setAuthError("팝업이 차단되었습니다. 브라우저 설정에서 팝업 차단을 해제해주세요.")
      } else if (error.code === "auth/unauthorized-domain") {
        setAuthError(
          "현재 도메인이 Firebase에 등록되지 않았습니다. Firebase 콘솔에서 승인된 도메인 목록에 추가해주세요.",
        )
      } else {
        setAuthError(error.message)
      }

      throw error
    }
  }

  // 카카오 로그인 처리
  const signInWithKakao = async () => {
    try {
      setAuthError(null)
      console.log("카카오 로그인 시도 중...")

      // 카카오 SDK가 로드되었는지 확인
      if (!window.Kakao) {
        throw new Error("카카오 SDK가 로드되지 않았습니다.")
      }

      // 카카오 SDK 초기화 확인
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY)
      }

      // 카카오 로그인 요청
      const kakaoResponse = await new Promise<any>((resolve, reject) => {
        window.Kakao.Auth.login({
          success: (authObj: any) => resolve(authObj),
          fail: (error: any) => reject(error),
        })
      })

      // 카카오 사용자 정보 요청
      const userInfo = await new Promise<any>((resolve, reject) => {
        window.Kakao.API.request({
          url: "/v2/user/me",
          success: (res: any) => resolve(res),
          fail: (error: any) => reject(error),
        })
      })

      console.log("카카오 로그인 성공:", userInfo)

      // 백엔드에 커스텀 토큰 요청 (실제 구현 필요)
      // 이 부분은 백엔드 API가 구현되어 있어야 합니다
      const response = await fetch("/api/auth/kakao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kakaoAccessToken: kakaoResponse.access_token,
          kakaoId: userInfo.id,
          email: userInfo.kakao_account?.email,
          displayName: userInfo.kakao_account?.profile?.nickname,
          photoURL: userInfo.kakao_account?.profile?.profile_image_url,
        }),
      })

      if (!response.ok) {
        throw new Error("카카오 로그인 처리 중 오류가 발생했습니다.")
      }

      const { customToken } = await response.json()

      // Firebase에 커스텀 토큰으로 로그인
      const userCredential = await signInWithCustomToken(auth, customToken)

      // Firestore에 사용자 정보 저장
      await saveUserToFirestore(userCredential.user, "kakao")

      return userCredential
    } catch (error: any) {
      console.error("카카오 로그인 오류:", error)
      setAuthError(error.message || "카카오 로그인 중 오류가 발생했습니다.")
      throw error
    }
  }

  // 로그아웃 처리
  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setAuthError(null)
    } catch (error) {
      console.error("로그아웃 오류:", error)
    }
  }

  // 프리미엄 접근 권한 확인
  const checkPremiumAccess = () => {
    if (!user) return false

    const subscription = user.subscription
    if (!subscription) return false

    return (
      subscription.isActive &&
      subscription.plan === "premium" &&
      (subscription.expiresAt === null || subscription.expiresAt > Date.now())
    )
  }

  // 인증 상태 변경 감지
  useEffect(() => {
    console.log("인증 상태 리스너 설정...")
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log("인증 상태 변경 감지:", authUser ? `${authUser.displayName} (${authUser.email})` : "로그아웃 상태")

      if (authUser) {
        // 구독 정보 가져오기
        const subscription = await fetchUserSubscription(authUser)

        // 확장된 사용자 객체 생성
        const extendedUser = {
          ...authUser,
          subscription,
        } as ExtendedUser

        setUser(extendedUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      console.log("인증 상태 리스너 해제")
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithKakao,
        signOut,
        checkPremiumAccess,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 인증 컨텍스트 사용을 위한 훅
export const useAuth = () => useContext(AuthContext)

// 타입 확장을 위한 전역 인터페이스 선언
declare global {
  interface Window {
    Kakao: any
  }
}
