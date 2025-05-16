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

function generatePrompt(userInput: string, mode: string): string {
  let modeInstruction = ""

  switch (mode) {
    case "light":
      modeInstruction = "풍자적이고 유머를 섞은 말투로 부드럽게 표현해 주세요."
      break
    case "hard":
      modeInstruction = "직설적이고 감정이 실린 말투로 불쾌한 감정을 표현해 주세요."
      break
    case "very_hard":
      modeInstruction = "강한 분노를 담은 말투로 과감하고 솔직하게 표현해 주세요. 단, 창의적으로 표현해주세요."
      break
    default:
      modeInstruction = "적절한 감정 표현으로 상황을 설명해 주세요."
  }

  return `
당신은 감정을 해소하는 감정 대변 작가입니다.
사용자의 상황을 듣고, 그 상황에 적절한 감정 말투(${mode})로 응답하세요.
${modeInstruction}

상황: ${userInput}

응답은 사람 말투로, 2~3문장으로 자연스럽고 강렬하게 써주세요.
`
}

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

    const { userInput, mode } = reqBody

    if (!userInput || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // OpenAI API 키 확인
    if (!apiKey) {
      console.error("OpenAI API 키가 설정되지 않았습니다.")
      return NextResponse.json({ error: "Server configuration error: API key is missing" }, { status: 500 })
    }

    const prompt = generatePrompt(userInput, mode)

    try {
      // OpenAI 모델을 gpt-4o에서 gpt-3.5-turbo로 변경
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // gpt-4o 대신 gpt-3.5-turbo 사용
        messages: [
          { role: "system", content: "You are a helpful assistant that responds in Korean." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 200,
      })

      const response = completion.choices[0].message.content

      return NextResponse.json({ response })
    } catch (openaiError: any) {
      console.error("OpenAI API 오류:", openaiError)

      // OpenAI 오류 메시지 추출
      const errorMessage = openaiError.message || "Unknown OpenAI error"
      const errorStatus = openaiError.status || 500

      return NextResponse.json({ error: `OpenAI API error: ${errorMessage}` }, { status: errorStatus })
    }
  } catch (error) {
    console.error("Error generating response:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
