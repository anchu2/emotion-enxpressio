import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Firebase 구성 디버깅
console.log("Firebase 구성 로드 중...")
console.log("API 키 확인:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "설정됨" : "설정되지 않음")
console.log("Auth 도메인 확인:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "설정됨" : "설정되지 않음")
console.log("Project ID 확인:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "설정됨" : "설정되지 않음")

// 현재 도메인 정보 로깅
console.log("현재 도메인:", typeof window !== "undefined" ? window.location.hostname : "SSR 환경")

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase 앱 초기화
console.log("Firebase 앱 초기화 시도...")
const app = initializeApp(firebaseConfig)
console.log("Firebase 앱 초기화 완료")

// Firebase 서비스 내보내기
export const auth = getAuth(app)
export const db = getFirestore(app)

// 개발 환경에서 디버깅을 위한 로그
if (process.env.NODE_ENV === "development") {
  console.log("Firebase 인증 서비스 초기화됨")
}

export default app
