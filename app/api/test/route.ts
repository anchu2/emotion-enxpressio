import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({
      received: body,
      testResponse: "이것은 테스트 응답입니다. API 엔드포인트가 정상적으로 작동합니다.",
    })
  } catch (error) {
    console.error("Test API error:", error)
    return NextResponse.json({ error: "Test API error" }, { status: 500 })
  }
}
