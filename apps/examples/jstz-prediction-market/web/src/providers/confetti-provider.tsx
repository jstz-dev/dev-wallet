"use client";

import { useRef } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import type { TCanvasConfettiInstance } from "react-canvas-confetti/dist/types";
import { usePrefersReducedMotion } from "~/lib/hooks/usePrefersReducedMotion";

interface ConfettiOptions {
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
}

import { createContext, PropsWithChildren, useContext } from "react";

const ConfettiContext = createContext({ fireRealistic: () => {} });

export function useConfetti() {
  return useContext(ConfettiContext);
}

export function ConfettiProvider({ children }: PropsWithChildren) {
  const confettiRef = useRef<TCanvasConfettiInstance>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  function onInit({ confetti }: { confetti: TCanvasConfettiInstance }) {
    confettiRef.current = confetti;
  }

  function fireRealistic() {
    if (prefersReducedMotion || !confettiRef.current) return;

    const count = 200;
    const defaults = {
      origin: {
        y: 0.7,
      },
      zIndex: 999,
    };

    function fire(particleRatio: number, opts: ConfettiOptions) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      void confettiRef.current!({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }

  return (
    <ConfettiContext value={{ fireRealistic }}>
      {children}

      <ReactCanvasConfetti
        onInit={onInit}
        style={{
          position: "fixed",
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
        }}
      />
    </ConfettiContext>
  );
}
