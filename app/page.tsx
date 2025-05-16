"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Play,
  Pause,
  Copy,
  Share2,
  History,
  Save,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Trash2,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { usePayment } from "@/contexts/payment-context"
import { LoginModal } from "@/components/login-modal"
import { UserProfile } from "@/components/user-profile"
import { PaymentModal } from "@/components/payment-modal"
import { checkUsageLimit, getRemainingUsage } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// 히스토리 아이템 타입 정의
interface HistoryItem {
  id: string
  userInput: string
  mode: string
  response: string
  timestamp: number
}

export default function Home() {
  const [userInput, setUserInput] = useState("")
  const [mode, setMode] = useState("light")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeTab, setActiveTab] = useState("input")
  const [selectedVoice, setSelectedVoice] = useState("alloy")
  const [isMuted, setIsMuted] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginMessage, setLoginMessage] = useState("")
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTTSModal, setShowTTSModal] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { user, checkPremiumAccess } = useAuth()
  const { setShowPaymentModal: setShowPaymentModalFromContext } = usePayment()

  // 로그인 API 응답 속도 측정
  useEffect(() => {
    const measureLoginSpeed = async () => {
      const t0 = performance.now()
      const loginRes = await fetch("/api/kakao-login", { method: "POST" })
      const t1 = performance.now()
      console.log("Login API 응답 속도:", t1 - t0, "ms")
    }
    measureLoginSpeed()
  }, [])

  // 로컬 스토리지에서 히스토리 로드
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`emotionHistory_${user.uid}`)
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory))
        } catch (e) {
          console.error("히스토리 로드 실패:", e)
        }
      }
    } else {
      // 비로그인 상태에서는 일반 히스토리 사용
      const savedHistory = localStorage.getItem("emotionHistory")
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory))
        } catch (e) {
          console.error("히스토리 로드 실패:", e)
        }
      }
    }
  }, [user])

  // 히스토리 저장
  const saveToHistory = (newItem: Omit<HistoryItem, "id" | "timestamp">) => {
    const item: HistoryItem = {
      ...newItem,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }

    const updatedHistory = [item, ...history].slice(0, 20) // 최대 20개 항목 유지
    setHistory(updatedHistory)

    // 로그인 상태에 따라 다른 키로 저장
    const storageKey = user ? `emotionHistory_${user.uid}` : "emotionHistory"
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
  }

  // 히스토리 삭제
  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id)
    setHistory(updatedHistory)

    const storageKey = user ? `emotionHistory_${user.uid}` : "emotionHistory"
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))

    toast({
      title: "삭제 완료",
      description: "히스토리 항목이 삭제되었습니다.",
      duration: 2000,
    })
  }

  // 히스토리 전체 삭제
  const clearHistory = () => {
    setHistory([])

    const storageKey = user ? `emotionHistory_${user.uid}` : "emotionHistory"
    localStorage.removeItem(storageKey)

    toast({
      title: "히스토리 초기화",
      description: "모든 히스토리가 삭제되었습니다.",
      duration: 2000,
    })
  }

  // 히스토리 항목 로드
  const loadHistoryItem = (item: HistoryItem) => {
    setUserInput(item.userInput)
    setMode(item.mode)
    setResponse(item.response)
    setActiveTab("input")

    toast({
      title: "히스토리 로드",
      description: "이전 항목을 불러왔습니다.",
      duration: 2000,
    })
  }

  // 모드 접근 권한 확인
  const checkModeAccess = (selectedMode: string): boolean => {
    // 가벼운 모드는 모든 사용자 접근 가능
    if (selectedMode === "light") return true

    // 강한 모드는 로그인 필요
    if (selectedMode === "hard") return !!user

    // 매우 강한 모드는 프리미엄 구독 필요
    if (selectedMode === "very_hard") return checkPremiumAccess()

    return false
  }

  // TTS 접근 권한 확인
  const checkTTSAccess = (): boolean => {
    return checkPremiumAccess()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 사용량 제한 체크
    if (!checkUsageLimit("gpt")) {
      if (!user) {
        setLoginMessage("이 감정 강도를 사용하려면 로그인이 필요합니다.")
        setShowLoginModal(true)
      } else {
        setShowPaymentModal(true)
      }
      return
    }

    // 가벼운 모드는 로그인 없이 항상 작동
    if (mode !== "light") {
      // 다른 모드에 대해서만 접근 권한 확인
      if (!checkModeAccess(mode)) {
        if (!user) {
          // 로그인 필요
          setLoginMessage("이 감정 강도를 사용하려면 로그인이 필요합니다.")
          setShowLoginModal(true)
        } else {
          // 프리미엄 구독 필요
          toast({
            title: "프리미엄 구독 필요",
            description: "이 감정 강도는 프리미엄 구독자만 이용할 수 있습니다.",
            duration: 3000,
          })
          setShowPaymentModal(true)
        }
        return
      }
    }

    setIsLoading(true)
    setActiveTab("result")

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userInput, mode }),
      })

      // 응답이 성공적이지 않은 경우
      if (!res.ok) {
        // 응답을 클론하여 여러 번 읽을 수 있도록 함
        const resClone = res.clone()

        let errorMessage = "응답 생성 중 오류가 발생했습니다."

        // 먼저 JSON으로 파싱 시도
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          // JSON 파싱 실패 시 텍스트로 읽기 시도
          try {
            errorMessage = await resClone.text()
          } catch (textError) {
            console.error("응답 텍스트 읽기 실패:", textError)
          }
        }

        throw new Error(errorMessage)
      }

      // 성공적인 응답 처리
      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResponse(data.response)

      // 히스토리에 저장
      if (data.response) {
        saveToHistory({
          userInput,
          mode,
          response: data.response,
        })
      }
    } catch (error) {
      console.error("Error generating response:", error)
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "응답 생성 중 문제가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTTS = async () => {
    if (!response) return

    // 사용량 제한 체크
    if (!checkUsageLimit("tts")) {
      if (!user) {
        setLoginMessage("음성 기능을 사용하려면 로그인이 필요합니다.")
        setShowLoginModal(true)
      } else {
        setShowPaymentModal(true)
      }
      return
    }

    // 가벼운 모드는 로그인 없이 TTS 사용 가능
    if (mode !== "light") {
      // TTS 접근 권한 확인
      if (!checkTTSAccess()) {
        if (!user) {
          // 로그인 필요
          setLoginMessage("음성 기능을 사용하려면 로그인이 필요합니다.")
          setShowLoginModal(true)
        } else {
          // 프리미엄 구독 필요
          toast({
            title: "프리미엄 구독 필요",
            description: "음성 기능은 프리미엄 구독자만 이용할 수 있습니다.",
            duration: 3000,
          })
          setShowPaymentModal(true)
        }
        return
      }
    }

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // OpenAI TTS API 호출
      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: response,
          voice: selectedVoice,
        }),
      });

      if (!ttsResponse.ok) {
        const error = await ttsResponse.json();
        throw new Error(error.error || "TTS 생성 실패");
      }

      // 음성 데이터를 Blob으로 변환
      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // 기존 오디오 객체가 있으면 정리
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      // 새 오디오 객체 생성 및 재생
      const audio = new Audio(audioUrl);
      audio.volume = isMuted ? 0 : 1;
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        toast({
          title: "재생 오류",
          description: "음성을 재생하는 중 오류가 발생했습니다.",
          duration: 3000,
        });
      };

      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("TTS 오류:", error);
      toast({
        title: "음성 생성 실패",
        description: error instanceof Error ? error.message : "음성을 생성하는 중 오류가 발생했습니다.",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (!response) return

    navigator.clipboard.writeText(response)
    toast({
      title: "복사 완료",
      description: "텍스트가 클립보드에 복사되었습니다.",
      duration: 2000,
    })
  }

  const shareResponse = async () => {
    if (!response) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: "감정 표현 생성기",
          text: response,
        })
      } catch (error) {
        console.error("공유 실패:", error)
      }
    } else {
      copyToClipboard()
      toast({
        title: "공유 기능 미지원",
        description: "이 브라우저는 공유 기능을 지원하지 않아 클립보드에 복사되었습니다.",
        duration: 3000,
      })
    }
  }

  // 감정 모드에 따른 색상 및 스타일 설정
  const getModeStyles = () => {
    switch (mode) {
      case "light":
        return {
          gradientFrom: "from-blue-400",
          gradientTo: "to-purple-400",
          buttonColor: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
          borderColor: "border-blue-300",
          textColor: "text-blue-600 dark:text-blue-400",
        }
      case "hard":
        return {
          gradientFrom: "from-orange-400",
          gradientTo: "to-red-500",
          buttonColor: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
          borderColor: "border-orange-300",
          textColor: "text-orange-600 dark:text-orange-400",
        }
      case "very_hard":
        return {
          gradientFrom: "from-red-500",
          gradientTo: "to-pink-600",
          buttonColor: "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700",
          borderColor: "border-red-400",
          textColor: "text-red-600 dark:text-red-400",
        }
      default:
        return {
          gradientFrom: "from-blue-400",
          gradientTo: "to-purple-400",
          buttonColor: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
          borderColor: "border-blue-300",
          textColor: "text-blue-600 dark:text-blue-400",
        }
    }
  }

  const modeStyles = getModeStyles()

  return (
    <main className="container mx-auto py-10 px-4 max-w-3xl min-h-screen">
      <Card
        className="w-full shadow-lg border-t-4 transition-all duration-300 ease-in-out"
        style={{ borderTopColor: `var(--${mode === "light" ? "blue" : mode === "hard" ? "orange" : "red"}-500)` }}
      >
        <CardHeader className="relative">
          <div className="absolute right-6 top-6 flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full bg-muted/80 hover:bg-muted"
              aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>

            {user ? (
              <UserProfile />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoginMessage("서비스를 이용하려면 로그인해주세요.")
                  setShowLoginModal(true)
                }}
                className="ml-2"
              >
                로그인
              </Button>
            )}
          </div>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <span
              className={`bg-clip-text text-transparent bg-gradient-to-r ${modeStyles.gradientFrom} ${modeStyles.gradientTo}`}
            >
              감정 표현 생성기
            </span>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </CardTitle>
          <CardDescription className="text-base">
            상황을 입력하고 감정 강도를 선택하면 상황에 맞는 감정 표현을 생성합니다.
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="input" className="text-sm sm:text-base">
                입력
              </TabsTrigger>
              <TabsTrigger value="result" className="text-sm sm:text-base">
                결과
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm sm:text-base">
                히스토리
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="input" className="m-0">
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="situation" className="text-base font-medium">
                    상황 설명
                  </Label>
                  <Textarea
                    id="situation"
                    placeholder="당신이 겪은 상황을 설명해주세요..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className={`min-h-[120px] transition-all duration-300 focus:ring-2 focus:ring-offset-1 ${modeStyles.borderColor}`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode" className="text-base font-medium">
                    감정 강도
                  </Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger id="mode" className={`transition-all duration-300 ${modeStyles.borderColor}`}>
                      <SelectValue placeholder="감정 강도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light" className="flex items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          가벼운 (유머, 풍자)
                        </div>
                      </SelectItem>
                      <SelectItem value="hard" className="flex items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                          강한 (직설적, 날카로운)
                          {!user && <Lock className="ml-2 h-3 w-3 text-muted-foreground" />}
                        </div>
                      </SelectItem>
                      <SelectItem value="very_hard" className="flex items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          매우 강한 (격렬한 감정 표현)
                          {!checkPremiumAccess() && <Sparkles className="ml-2 h-3 w-3 text-yellow-500" />}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {mode === "hard" && !user && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Lock className="inline-block mr-1 h-3 w-3" />
                      로그인 후 이용 가능합니다.
                    </p>
                  )}

                  {mode === "very_hard" && !checkPremiumAccess() && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
                      <Sparkles className="inline-block mr-1 h-3 w-3" />
                      프리미엄 구독 시 이용 가능합니다.
                    </p>
                  )}
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                  <Button
                    type="submit"
                    className={`w-full font-medium text-white transition-all duration-300 ${modeStyles.buttonColor}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        생성 중...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        감정 표현 생성하기
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </TabsContent>

          <TabsContent value="result" className="m-0">
            <CardContent className="space-y-4">
              {response ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-lg font-medium ${modeStyles.textColor}`}>생성된 감정 표현</h3>
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleTTS}
                          className={`p-2 rounded-full ${
                            mode === "light" || checkTTSAccess()
                              ? "bg-muted/80 hover:bg-muted"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                          title={
                            mode === "light"
                              ? "음성으로 듣기"
                              : !checkTTSAccess()
                                ? "프리미엄 구독 필요"
                                : isPlaying
                                  ? "음성 중지"
                                  : "음성으로 듣기"
                          }
                        >
                          {mode !== "light" && !checkTTSAccess() ? (
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                          ) : isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={copyToClipboard}
                          className="p-2 rounded-full bg-muted/80 hover:bg-muted"
                          title="클립보드에 복사"
                        >
                          <Copy className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={shareResponse}
                          className="p-2 rounded-full bg-muted/80 hover:bg-muted"
                          title="공유하기"
                        >
                          <Share2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                    <div className={`p-6 rounded-lg bg-muted/50 border ${modeStyles.borderColor} shadow-sm`}>
                      <p className="whitespace-pre-wrap text-lg leading-relaxed">{response}</p>
                    </div>

                    {(mode === "light" || checkTTSAccess()) && (
                      <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="voice-select" className="text-sm">
                              OpenAI 음성 선택
                            </Label>
                          </div>
                          <Select
                            value={selectedVoice}
                            onValueChange={setSelectedVoice}
                            disabled={isLoading}
                          >
                            <SelectTrigger id="voice-select" className="w-full">
                              <SelectValue placeholder="음성 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alloy">Alloy (중성)</SelectItem>
                              <SelectItem value="echo">Echo (남성)</SelectItem>
                              <SelectItem value="fable">Fable (여성)</SelectItem>
                              <SelectItem value="onyx">Onyx (남성)</SelectItem>
                              <SelectItem value="nova">Nova (여성)</SelectItem>
                              <SelectItem value="shimmer">Shimmer (여성)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch id="mute" checked={isMuted} onCheckedChange={setIsMuted} />
                          <Label htmlFor="mute" className="text-sm cursor-pointer flex items-center">
                            {isMuted ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
                            {isMuted ? "음소거" : "소리 켜기"}
                          </Label>
                        </div>
                      </div>
                    )}

                    {mode !== "light" && !checkTTSAccess() && (
                      <div className="mt-6 p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/50 rounded-lg">
                        <div className="flex items-start">
                          <Sparkles className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="font-medium text-sm">음성 기능은 프리미엄 전용 기능입니다</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              프리미엄 구독으로 업그레이드하여 음성 기능을 이용해보세요.
                            </p>
                            <Button
                              size="sm"
                              className="mt-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
                              onClick={() => setShowPaymentModal(true)}
                            >
                              프리미엄으로 업그레이드
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <History className="h-12 w-12 mb-4 opacity-50" />
                  <p>아직 생성된 결과가 없습니다.</p>
                  <p className="text-sm mt-2">상황을 입력하고 감정 표현을 생성해보세요.</p>
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="history" className="m-0">
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">저장된 히스토리</h3>
                    <Button variant="outline" size="sm" onClick={clearHistory} className="text-xs flex items-center">
                      <Trash2 className="h-3 w-3 mr-1" />
                      전체 삭제
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    <AnimatePresence>
                      {history.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="relative"
                        >
                          <Card className="p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 mr-8">
                                <p className="text-sm font-medium truncate">{item.userInput}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(item.timestamp).toLocaleString()} ·
                                  <span
                                    className={`ml-1 ${
                                      item.mode === "light"
                                        ? "text-blue-500"
                                        : item.mode === "hard"
                                          ? "text-orange-500"
                                          : "text-red-500"
                                    }`}
                                  >
                                    {item.mode === "light" ? "가벼운" : item.mode === "hard" ? "강한" : "매우 강한"}
                                  </span>
                                </p>
                              </div>
                              <div className="flex space-x-1 absolute right-3 top-3">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => loadHistoryItem(item)}
                                  className="p-1.5 rounded-full hover:bg-background"
                                  title="불러오기"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => deleteHistoryItem(item.id)}
                                  className="p-1.5 rounded-full hover:bg-background"
                                  title="삭제"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </motion.button>
                              </div>
                            </div>
                            <p className="text-xs mt-2 line-clamp-2 text-muted-foreground">{item.response}</p>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <History className="h-12 w-12 mb-4 opacity-50" />
                  <p>저장된 히스토리가 없습니다.</p>
                  <p className="text-sm mt-2">감정 표현을 생성하면 자동으로 저장됩니다.</p>
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground pt-4 pb-6">
          <p>© 2025 감정 표현 생성기</p>
          <p className="mt-2 sm:mt-0">모든 표현은 AI에 의해 생성되며 실제 감정과 다를 수 있습니다.</p>
        </CardFooter>
      </Card>

      {/* 로그인 모달 */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} message={loginMessage} />

      {/* 결제 모달 */}
      <PaymentModal />

      <Dialog open={showPaymentModal} onOpenChange={() => setShowPaymentModal(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>프리미엄 구독</DialogTitle>
            <DialogDescription>
              ₩4,900으로 인생 스트레스 씻겨내기
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">프리미엄 혜택</h4>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>모든 감정 강도 모드 이용 가능</li>
                <li>음성 출력 기능 이용</li>
                <li>히스토리 저장</li>
                <li>광고 없는 깔끔한 환경</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">월 구독료</h4>
              <p className="text-2xl font-bold">₩4,900</p>
              <p className="text-sm text-muted-foreground">감정 해소 후 언제든지 해지가능</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPaymentModal(false)} className="w-full">
              프리미엄 구독하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
