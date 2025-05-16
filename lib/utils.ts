import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function checkUsageLimit(mode: "gpt" | "tts"): boolean {
  const today = new Date().toISOString().split("T")[0];
  const key = `usage_${today}`;
  const usage = JSON.parse(localStorage.getItem(key) || "{}");

  const isPremium = localStorage.getItem("isPremium") === "true";

  const limits = {
    gpt: isPremium ? 15 : 5,
    tts: isPremium ? 15 : 0,
  };

  usage[mode] = (usage[mode] || 0) + 1;

  if (usage[mode] > limits[mode]) {
    if (!isPremium) {
      alert(`오늘의 ${mode.toUpperCase()} 사용 한도를 초과했습니다.\n\n프리미엄 구독(₩4,900/월)으로 업그레이드하여 더 많은 기능을 이용해보세요!`);
    } else {
      alert(`오늘의 ${mode.toUpperCase()} 사용 한도를 초과했습니다.`);
    }
    return false;
  }

  localStorage.setItem(key, JSON.stringify(usage));
  return true;
}

// 사용량 확인 함수
export function getUsageCount(mode: "gpt" | "tts"): number {
  const today = new Date().toISOString().split("T")[0];
  const key = `usage_${today}`;
  const usage = JSON.parse(localStorage.getItem(key) || "{}");
  return usage[mode] || 0;
}

// 남은 사용량 확인 함수
export function getRemainingUsage(mode: "gpt" | "tts"): number {
  const today = new Date().toISOString().split("T")[0];
  const key = `usage_${today}`;
  const usage = JSON.parse(localStorage.getItem(key) || "{}");
  const isPremium = localStorage.getItem("isPremium") === "true";
  const limits = {
    gpt: isPremium ? 15 : 5,
    tts: isPremium ? 15 : 0,
  };
  return Math.max(0, limits[mode] - (usage[mode] || 0));
}
