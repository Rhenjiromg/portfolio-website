"use client";
import { useEffect, useMemo, useState } from "react";

type UseTypewriterOpts = {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  startDelay?: number;
  betweenWordsDelay?: number;
  loop?: boolean;
  classname?: string;
};

type Phase = "idle" | "typing" | "pausing" | "deleting" | "done";

export function useTypewriter({
  words,
  typingSpeed = 70,
  deletingSpeed = 40,
  startDelay = 400,
  betweenWordsDelay = 1000,
  loop = true,
  classname,
}: UseTypewriterOpts) {
  const safeWords = useMemo(() => words.filter(Boolean), [words]);
  const [index, setIndex] = useState(0);
  const [sub, setSub] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [cursorVisible, setCursorVisible] = useState(true);

  // blink cursor
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 450);
    return () => clearInterval(id);
  }, []);

  // drive the type/delete state machine
  useEffect(() => {
    if (!safeWords.length || phase === "done") return;
    let t: ReturnType<typeof setTimeout>;
    const isLastWord = index % safeWords.length === safeWords.length - 1;
    const current = safeWords[index % safeWords.length];

    switch (phase) {
      case "idle":
        t = setTimeout(() => setPhase("typing"), startDelay);
        break;

      case "typing": {
        const next = current.slice(0, sub.length + 1);
        if (next === sub) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPhase("pausing");
        } else {
          t = setTimeout(() => setSub(next), typingSpeed);
        }
        break;
      }

      case "pausing":
        if (sub === current) {
          // If we shouldn't loop and this is the last word, stop here (don't delete)
          if (!loop && isLastWord) {
            setPhase("done");
          } else {
            t = setTimeout(() => setPhase("deleting"), betweenWordsDelay);
          }
        } else {
          setPhase("typing");
        }
        break;

      case "deleting": {
        if (sub.length === 0) {
          const nextIndex = index + 1;
          if (!loop && nextIndex >= safeWords.length) {
            setPhase("done"); // safety: shouldn't normally reach here due to the pausing guard
          } else {
            setIndex(nextIndex % safeWords.length);
            setPhase("typing");
          }
        } else {
          t = setTimeout(
            () => setSub(current.slice(0, sub.length - 1)),
            deletingSpeed
          );
        }
        break;
      }
    }

    return () => clearTimeout(t);
  }, [
    phase,
    sub,
    index,
    safeWords,
    typingSpeed,
    deletingSpeed,
    startDelay,
    betweenWordsDelay,
    loop,
  ]);

  // You can also expose `done` if you want to style the cursor differently at the end
  return { text: sub, cursorVisible, done: phase === "done" };
}
