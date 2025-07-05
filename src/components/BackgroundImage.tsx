"use client";
import Image from "next/image";
import Lottie from "lottie-react";
import aura from "@/assets/aura01.json";

interface BackgroundImageProps {
  isAuraVisible: boolean;
}

export default function BackgroundImage({ isAuraVisible }: BackgroundImageProps) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none flex items-center justify-center md:items-end md:justify-end">
      <div className="relative w-64 h-80 md:w-[40vw] md:h-[90vh]">
        {/* オーラLottieアニメーション（送信時だけ・仏像の背後） */}
        {isAuraVisible && (
          <div
            className="absolute"
            style={{
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              transform: "translate(10%, 0)",
              zIndex: 0,
            }}
          >
            <Lottie
              animationData={aura}
              loop
              autoplay
              style={{ width: "100%", height: "100%", opacity: 0.3 }}
            />
          </div>
        )}
        <Image
          src="/robot_transparent.png"
          alt="仏像ロボット"
          width={600}
          height={900}
          className="absolute object-contain opacity-40 w-full h-full"
          priority
          style={{
            right: 0,
            bottom: 0,
            transform: "translate(10%, 0)",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
} 
