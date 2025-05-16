import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// OpenAI API 키 확인
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error("OPENAI_API_KEY is not defined")
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
})

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    let reqBody
    try {
      reqBody = await request.json()
    } catch (error) {
      console.error("요청 본문 파싱 오류:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { text, voice = "alloy" } = reqBody

    if (!text) {
      return NextResponse.json({ error: "Missing required text field" }, { status: 400 })
    }

    // OpenAI API 키 확인
    if (!apiKey) {
      console.error("OpenAI API 키가 설정되지 않았습니다.")
      return NextResponse.json({ error: "Server configuration error: API key is missing" }, { status: 500 })
    }

    try {
      // OpenAI TTS API 호출
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: text,
      })

      // 오디오 데이터를 arrayBuffer로 변환
      const buffer = await mp3.arrayBuffer()
      
      // 오디오를 응답으로 반환
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buffer.byteLength.toString(),
        },
      })
    } catch (openaiError: any) {
      console.error("OpenAI API 오류:", openaiError)

      // OpenAI 오류 메시지 추출
      const errorMessage = openaiError.message || "Unknown OpenAI error"
      const errorStatus = openaiError.status || 500

      return NextResponse.json({ error: `OpenAI API error: ${errorMessage}` }, { status: errorStatus })
    }
  } catch (error) {
    console.error("Error generating TTS:", error)
    return NextResponse.json({ error: "Failed to generate TTS" }, { status: 500 })
  }
} 