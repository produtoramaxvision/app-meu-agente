import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SplineScene } from '@/components/ui/spline-scene';
import { PromptInputBox } from './PromptInputBox';

interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
  messageCount?: number;
}

interface ChatIntroAnimationProps {
  onSend: (message: string) => void;
  onSelectSession?: (sessionId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  chatSessions?: ChatSession[];
}

// Generate stable random positions for stars
const generateStarPositions = (count: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      left: `${(i * 7.3 + 13) % 100}%`,
      top: `${(i * 11.7 + 23) % 100}%`,
      size: 0.5 + (i % 3) * 0.5,
      duration: 3 + (i % 5),
      delay: (i % 8) * 0.5,
      opacity: 0.3 + (i % 4) * 0.15,
    });
  }
  return stars;
};

export function ChatIntroAnimation({ 
  onSend, 
  onSelectSession,
  isLoading = false, 
  disabled = false,
  chatSessions = []
}: ChatIntroAnimationProps) {
  const [introComplete, setIntroComplete] = useState(false);
  const [showInput, setShowInput] = useState(false);
  
  // Memoize star positions to prevent regeneration on re-renders
  const starPositions = useMemo(() => generateStarPositions(60), []);

  useEffect(() => {
    // Inicia a animação de entrada do input após o robô aparecer
    const introTimer = setTimeout(() => {
      setIntroComplete(true);
    }, 2000);

    const inputTimer = setTimeout(() => {
      setShowInput(true);
    }, 2500);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(inputTimer);
    };
  }, []);

  const handleSend = useCallback((message: string) => {
    onSend(message);
  }, [onSend]);

  const handleSelectSession = useCallback((sessionId: string) => {
    onSelectSession?.(sessionId);
  }, [onSelectSession]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-black pointer-events-none z-0">
      {/* Deep Space Background - All Black with subtle depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050508] to-[#0a0a0f]" />
      
      {/* Nebula glow effects - subtle silver/gray */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-radial from-slate-400/8 via-transparent to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-gray-400/8 via-transparent to-transparent blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Star field - particles rising like universe */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {starPositions.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: [0, star.opacity, star.opacity, 0],
              y: [0, -150, -300],
              scale: [0, 1, 1, 0],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Distant stars - static twinkling */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={`static-star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * 3.7 + 5) % 100}%`,
              top: `${(i * 7.1 + 3) % 100}%`,
              width: 1 + (i % 2),
              height: 1 + (i % 2),
              opacity: 0.1 + (i % 5) * 0.1,
            }}
            animate={{
              opacity: [0.1 + (i % 5) * 0.1, 0.4 + (i % 3) * 0.2, 0.1 + (i % 5) * 0.1],
            }}
            transition={{
              duration: 2 + (i % 4),
              repeat: Infinity,
              delay: (i % 10) * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* 3D Robot Scene - Full screen background */}
      <motion.div
        className="absolute top-16 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-auto"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: introComplete ? 0.9 : 1,
          y: introComplete ? -30 : 0,
        }}
        transition={{ 
          duration: 1.5, 
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <div className="relative w-full h-full">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </motion.div>

      {/* Content overlay - Input box */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-8 pointer-events-auto">
        <AnimatePresence>
          {showInput && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.4, 0, 0.2, 1],
                delay: 0.2 
              }}
              className="max-w-2xl mx-auto relative"
            >
              {/* Subtle glow effect behind input */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-400/10 via-gray-300/10 to-slate-400/10 blur-2xl rounded-3xl scale-110" />
              
              <PromptInputBox
                onSend={handleSend}
                onSelectSession={handleSelectSession}
                isLoading={isLoading}
                disabled={disabled}
                placeholder="Digite sua mensagem..."
                className="relative backdrop-blur-md bg-[#1F2023] border-[#444444]"
                chatSessions={chatSessions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Vignette effect for depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black/50" />
    </div>
  );
}
