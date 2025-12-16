"use client";

import * as React from "react";
import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, text: "Mínimo 8 caracteres", key: "length" },
  { regex: /[a-z]/, text: "Letra minúscula (a-z)", key: "lowercase" },
  { regex: /[A-Z]/, text: "Letra maiúscula (A-Z)", key: "uppercase" },
  { regex: /[0-9]/, text: "Número (0-9)", key: "number" },
  { regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?/]/, text: "Símbolo (!@#$%...)", key: "symbol" },
] as const;

type StrengthScore = 0 | 1 | 2 | 3 | 4 | 5;

const STRENGTH_CONFIG = {
  colors: {
    0: "bg-gray-200 dark:bg-gray-700",
    1: "bg-red-500",
    2: "bg-orange-500",
    3: "bg-amber-500",
    4: "bg-lime-500",
    5: "bg-emerald-500",
  } as Record<StrengthScore, string>,
  texts: {
    0: "Digite uma senha",
    1: "Muito fraca",
    2: "Fraca",
    3: "Razoável",
    4: "Forte",
    5: "Muito forte",
  } as Record<StrengthScore, string>,
  textColors: {
    0: "text-gray-500",
    1: "text-red-600",
    2: "text-orange-600",
    3: "text-amber-600",
    4: "text-lime-600",
    5: "text-emerald-600",
  } as Record<StrengthScore, string>,
};

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const { score, requirements } = useMemo(() => {
    const reqs = PASSWORD_REQUIREMENTS.map((req) => ({
      met: req.regex.test(password),
      text: req.text,
      key: req.key,
    }));

    return {
      score: reqs.filter((req) => req.met).length as StrengthScore,
      requirements: reqs,
    };
  }, [password]);

  // Cores progressivas para as barras
  const getBarColor = (index: number): string => {
    if (index >= score) return "bg-gray-200 dark:bg-gray-700";
    
    // Gradiente de cor baseado na força
    const progressColors = [
      "bg-red-500",
      "bg-orange-500", 
      "bg-amber-500",
      "bg-lime-500",
      "bg-emerald-500",
    ];
    
    return progressColors[Math.min(score - 1, 4)];
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Barra de força com animação */}
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300 ease-out",
                getBarColor(index)
              )}
              style={{
                transform: index < score ? "scaleY(1.2)" : "scaleY(1)",
              }}
            />
          ))}
        </div>

        {/* Texto de força */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-muted">Força da senha:</span>
          <span
            className={cn(
              "text-xs font-medium transition-colors duration-200",
              STRENGTH_CONFIG.textColors[score]
            )}
          >
            {STRENGTH_CONFIG.texts[score]}
          </span>
        </div>
      </div>

      {/* Lista de requisitos com ícones animados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {requirements.map((req) => (
          <div
            key={req.key}
            className={cn(
              "flex items-center gap-2 text-xs transition-all duration-200",
              req.met ? "text-emerald-600" : "text-text-muted"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200",
                req.met
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-gray-100 dark:bg-gray-800"
              )}
            >
              {req.met ? (
                <Check className="w-2.5 h-2.5 text-emerald-600" />
              ) : (
                <X className="w-2.5 h-2.5 text-gray-400" />
              )}
            </div>
            <span className={cn(req.met && "font-medium")}>{req.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PasswordStrengthMeter;
