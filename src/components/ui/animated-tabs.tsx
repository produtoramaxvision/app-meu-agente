"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: AnimatedTab[];
  defaultTab?: string;
  className?: string;
}

export function AnimatedTabs({ tabs, defaultTab, className }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full flex flex-col gap-6", className)}>
      {/* Tab Navigation - Responsive */}
      <div className="relative">
        {/* Desktop Layout - Flex with equal distribution (1024px+) */}
        <div className="hidden lg:flex gap-2 bg-muted/50 backdrop-blur-sm p-1 rounded-xl border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex-1 px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground outline-none transition-colors flex items-center justify-center gap-2",
                "hover:text-foreground hover:bg-background/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab-desktop"
                  className="absolute inset-0 bg-background shadow-sm backdrop-blur-sm rounded-lg border"
                  transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Tablet Layout - Distribuição fluida (640px - 1023px) */}
        <div className="hidden sm:block lg:hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 bg-muted/50 backdrop-blur-sm p-1 rounded-xl border w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex-1 px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground outline-none transition-colors flex items-center justify-center gap-2",
                    "hover:text-foreground hover:bg-background/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="active-tab-tablet"
                      className="absolute inset-0 bg-background shadow-sm backdrop-blur-sm rounded-lg border"
                      transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Layout - Horizontal scroll (< 640px) */}
        <div className="sm:hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 bg-muted/50 backdrop-blur-sm p-1 rounded-xl border min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground outline-none transition-colors flex items-center justify-center gap-2 min-w-fit",
                    "hover:text-foreground hover:bg-background/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="active-tab-mobile"
                      className="absolute inset-0 bg-background shadow-sm backdrop-blur-sm rounded-lg border"
                      transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {tabs.map(
            (tab) =>
              activeTab === tab.id && (
                <motion.div
                  key={tab.id}
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                    y: 20,
                    filter: "blur(10px)",
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0, 
                    filter: "blur(0px)" 
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.95, 
                    y: -20, 
                    filter: "blur(10px)" 
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="w-full"
                >
                  {tab.content}
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
