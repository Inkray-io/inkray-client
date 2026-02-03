"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InviteCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  onComplete?: (code: string) => void;
}

const CODE_LENGTH = 8;

export function InviteCodeInput({
  value,
  onChange,
  disabled = false,
  error = false,
  onComplete,
}: InviteCodeInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Extract just the 8-character code part (without INK- prefix)
  const codeChars = value.replace(/^INK-?/i, "").slice(0, CODE_LENGTH).split("");

  // Pad with empty strings to always have 8 slots
  while (codeChars.length < CODE_LENGTH) {
    codeChars.push("");
  }

  // Trigger shake animation on error
  useEffect(() => {
    if (error) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle completion callback
  useEffect(() => {
    const fullCode = codeChars.join("");
    if (fullCode.length === CODE_LENGTH && !codeChars.includes("") && onComplete) {
      onComplete(`INK-${fullCode}`);
    }
  }, [codeChars, onComplete]);

  const updateValue = useCallback((newChars: string[]) => {
    const cleanedChars = newChars.map(c => c.toUpperCase().replace(/[^A-Z0-9]/g, "")).slice(0, CODE_LENGTH);
    const newCode = cleanedChars.join("");
    onChange(newCode ? `INK-${newCode}` : "");
  }, [onChange]);

  const handleInputChange = useCallback((index: number, inputValue: string) => {
    if (disabled) return;

    const char = inputValue.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);

    if (char) {
      const newChars = [...codeChars];
      newChars[index] = char;
      updateValue(newChars);

      // Move to next input
      if (index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  }, [codeChars, disabled, updateValue]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const newChars = [...codeChars];

      if (codeChars[index]) {
        // Clear current box
        newChars[index] = "";
        updateValue(newChars);
      } else if (index > 0) {
        // Move to previous box and clear it
        newChars[index - 1] = "";
        updateValue(newChars);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }, [codeChars, disabled, updateValue]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;

    e.preventDefault();
    let pastedText = e.clipboardData.getData("text").toUpperCase();

    // Strip INK- prefix if present
    pastedText = pastedText.replace(/^INK-?/i, "");

    // Clean and take only valid characters
    const cleanedChars = pastedText.replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH).split("");

    if (cleanedChars.length > 0) {
      const newChars = [...codeChars];
      cleanedChars.forEach((char, i) => {
        if (i < CODE_LENGTH) {
          newChars[i] = char;
        }
      });
      updateValue(newChars);

      // Focus the next empty input or the last one
      const nextEmptyIndex = newChars.findIndex(c => !c);
      const focusIndex = nextEmptyIndex === -1 ? CODE_LENGTH - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  }, [codeChars, disabled, updateValue]);

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(null);
  }, []);

  // Focus first empty input when clicking the container
  const handleContainerClick = useCallback(() => {
    if (disabled) return;
    const firstEmptyIndex = codeChars.findIndex(c => !c);
    const focusIndex = firstEmptyIndex === -1 ? CODE_LENGTH - 1 : firstEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  }, [codeChars, disabled]);

  const isComplete = codeChars.every(c => c !== "");
  const isFocused = focusedIndex !== null;

  return (
    <motion.div
      className={cn(
        "relative w-full",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      animate={isShaking ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {/* Main container */}
      <div
        onClick={handleContainerClick}
        className={cn(
          "flex items-center justify-center p-3 rounded-xl cursor-text transition-all duration-200",
          "bg-gray-50 dark:bg-slate-800/50",
          "border",
          error
            ? "border-red-300 dark:border-red-500/50"
            : isComplete
              ? "border-green-300 dark:border-green-500/50"
              : isFocused
                ? "border-primary/50"
                : "border-gray-200 dark:border-slate-700"
        )}
      >
        {/* INK Prefix */}
        <div className="flex items-center shrink-0">
          <span className={cn(
            "font-mono text-sm sm:text-base font-semibold tracking-wider select-none transition-colors duration-200",
            isComplete && !error
              ? "text-green-500 dark:text-green-400"
              : "text-gray-400 dark:text-slate-500"
          )}>
            INK
          </span>
          <span className={cn(
            "font-mono text-sm sm:text-base font-semibold mx-0.5 sm:mx-1 select-none transition-colors duration-200",
            isComplete && !error
              ? "text-green-400 dark:text-green-500"
              : "text-gray-300 dark:text-slate-600"
          )}>
            -
          </span>
        </div>

        {/* Character inputs */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {codeChars.map((char, index) => (
            <div key={index} className="relative">
              <input
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={1}
                value={char}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                disabled={disabled}
                className={cn(
                  "w-8 h-10 sm:w-9 sm:h-11 text-center text-base sm:text-lg font-mono font-semibold rounded-md sm:rounded-lg",
                  "transition-all duration-150 outline-none",
                  "bg-white dark:bg-slate-900",
                  "border",
                  error
                    ? "border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400"
                    : isComplete
                      ? "border-green-300 dark:border-green-500/50 text-green-600 dark:text-green-400"
                      : focusedIndex === index
                        ? "border-primary ring-2 ring-primary/20 text-gray-900 dark:text-white"
                        : char
                          ? "border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                          : "border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white",
                  disabled && "cursor-not-allowed"
                )}
              />

              {/* Cursor indicator for empty focused input */}
              <AnimatePresence>
                {!char && focusedIndex === index && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="w-0.5 h-4 sm:h-5 bg-primary rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
}
