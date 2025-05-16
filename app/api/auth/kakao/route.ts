import { NextResponse } from "next/server"
import admin from "firebase-admin"

// Firebase Admin 초기화
let app: admin.app.App

try {
  app = admin.getApp()
} catch (error) {
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

export async function POST(request: Request) {
  try {
    const { kakaoId, email, displayName, photoURL } = await request.json()

    if (!kakaoId) {
      return NextResponse.json({ error: "카카오 ID가 필요합니다." }, { status: 400 })
    }

    // 사용자 ID 생성 (카카오 ID 기반)
    const uid = `kakao:${kakaoId}`

    // 사용자가 이미 존재하는지 확인
    try {
      await admin.auth().getUser(uid)
    } catch (error) {
      // 사용자가 존재하지 않으면 생성
      await admin.auth().createUser({
        uid,
        email,
        displayName,
        photoURL,
        emailVerified: true,
      })
    }

    // 커스텀 토큰 생성
    const customToken = await admin.auth().createCustomToken(uid, {
      provider: "kakao",
    })

    return NextResponse.json({ customToken })
  } catch (error) {
    console.error("카카오 인증 처리 오류:", error)
    return NextResponse.json({ error: "인증 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
