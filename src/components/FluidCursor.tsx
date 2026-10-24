"use client";

import React, { useEffect, useRef, useState } from "react";

interface WaterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  oscillation: number;
}

interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  maxAlpha: number;
  lineWidth: number;
  color: string;
}

type CursorState = "default" | "text" | "button" | "card" | "link" | "input" | "disabled";

export const FluidCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Accessibility & device checks
    if (typeof window === "undefined") return;

    // Disable on touch devices
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      !window.matchMedia("(hover: hover)").matches;
    if (isTouch) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      if (!canvas) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Coordinates and inertia
    let mouseX = -100;
    let mouseY = -100;
    let prevMouseX = -100;
    let prevMouseY = -100;
    let dotX = -100;
    let dotY = -100;
    let orbX = -100;
    let orbY = -100;
    let isVisible = false;
    let currentState: CursorState = "default";
    let isDark = document.documentElement.classList.contains("dark");
    let isMouseDown = false;
    let clickScale = 1.0;
    let time = 0;

    // Watch for dark/light class changes on html element
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Water trail particles & ripples
    const particles: WaterParticle[] = [];
    const ripples: WaterRipple[] = [];
    const MAX_PARTICLES = 40;
    const MAX_RIPPLES = 16;

    // Active magnetic target
    let magneticElement: HTMLElement | null = null;
    let magneticOriginalTransform = "";
    let magneticBound = { left: 0, top: 0, width: 0, height: 0, cx: 0, cy: 0 };

    // Hovered button/card for radial highlight
    let activeHighlightEl: HTMLElement | null = null;

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isVisible = true;

      const target = e.target as HTMLElement | null;

      let detectedState: CursorState = "default";
      let closestBtn: HTMLElement | null = null;
      let closestCard: HTMLElement | null = null;
      let isText = false;

      if (target) {
        if (target.closest("[disabled], [aria-disabled='true']")) {
          detectedState = "disabled";
        } else if (target.closest("input, textarea, [contenteditable='true'], select")) {
          detectedState = "input";
        } else if (
          (closestBtn = target.closest("button, [role='button'], .cc-btn, a.btn, [data-magnetic='true']"))
        ) {
          detectedState = "button";
        } else if (
          (closestCard = target.closest(".cc-card, .cc-metric-card, .interactive-card, [data-cursor='card']"))
        ) {
          detectedState = "card";
        } else if (target.closest("a, [role='link']")) {
          detectedState = "link";
        } else if (
          target.closest("h1, h2, h3, h4, h5, h6, .text-ripple, [data-cursor='text'], p.lead, label")
        ) {
          detectedState = "text";
          isText = true;
        }
      }

      currentState = detectedState;

      // Update button / card cursor-following radial light coordinates
      if (closestBtn) {
        const rect = closestBtn.getBoundingClientRect();
        closestBtn.style.setProperty("--cursor-x", `${e.clientX - rect.left}px`);
        closestBtn.style.setProperty("--cursor-y", `${e.clientY - rect.top}px`);
        activeHighlightEl = closestBtn;
      } else if (closestCard) {
        const rect = closestCard.getBoundingClientRect();
        closestCard.style.setProperty("--card-cursor-x", `${e.clientX - rect.left}px`);
        closestCard.style.setProperty("--card-cursor-y", `${e.clientY - rect.top}px`);
        activeHighlightEl = closestCard;
      } else if (activeHighlightEl) {
        activeHighlightEl = null;
      }

      // Magnetic interaction for major CTAs
      if (
        closestBtn &&
        (closestBtn.getAttribute("data-magnetic") === "true" ||
          closestBtn.classList.contains("emergency-attention") ||
          closestBtn.textContent?.includes("EMERGENCY") ||
          closestBtn.textContent?.includes("Analyze with AI") ||
          closestBtn.textContent?.includes("Submit Report"))
      ) {
        if (magneticElement !== closestBtn) {
          if (magneticElement) {
            magneticElement.style.transform = magneticOriginalTransform;
          }
          magneticElement = closestBtn;
          const rect = closestBtn.getBoundingClientRect();
          magneticBound = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            cx: rect.left + rect.width / 2,
            cy: rect.top + rect.height / 2,
          };
          magneticOriginalTransform = closestBtn.style.transform || "";
        }

        const dx = mouseX - magneticBound.cx;
        const dy = mouseY - magneticBound.cy;
        const isEmergency =
          closestBtn.classList.contains("emergency-attention") ||
          closestBtn.textContent?.includes("EMERGENCY");
        const maxPull = isEmergency ? 2 : 4;
        const pullX = Math.max(-maxPull, Math.min(maxPull, dx * 0.12));
        const pullY = Math.max(-maxPull, Math.min(maxPull, dy * 0.12));
        closestBtn.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;
      } else {
        if (magneticElement) {
          magneticElement.style.transform = magneticOriginalTransform;
          magneticElement = null;
        }
      }

      // Spawn flowing water wake particles
      const dist = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
      if (dist > 6 && detectedState !== "input") {
        if (particles.length < MAX_PARTICLES) {
          const darkColors = ["rgba(56, 189, 248,", "rgba(14, 165, 233,", "rgba(99, 102, 241,"];
          const lightColors = ["rgba(37, 99, 235,", "rgba(2, 132, 199,", "rgba(14, 116, 144,"];
          const palette = isDark ? darkColors : lightColors;
          const chosenColor = palette[Math.floor(Math.random() * palette.length)];

          particles.push({
            x: orbX + (Math.random() - 0.5) * 6,
            y: orbY + (Math.random() - 0.5) * 6,
            vx: (mouseX - prevMouseX) * -0.08 + (Math.random() - 0.5) * 0.4,
            vy: (mouseY - prevMouseY) * -0.08 + (Math.random() - 0.5) * 0.4,
            radius: Math.min(10, 4 + dist * 0.15),
            maxRadius: Math.min(20, 9 + dist * 0.28),
            alpha: isDark ? 0.35 : 0.25,
            life: 0,
            maxLife: isText ? 18 : 26,
            color: chosenColor,
            oscillation: Math.random() * Math.PI * 2,
          });
        }

        // Spawn gentle water disturbance when moving over text
        if (isText && ripples.length < MAX_RIPPLES && Math.random() < 0.28) {
          ripples.push({
            x: mouseX,
            y: mouseY,
            radius: 6,
            maxRadius: 26,
            alpha: isDark ? 0.3 : 0.2,
            maxAlpha: isDark ? 0.3 : 0.2,
            lineWidth: 1.2,
            color: isDark ? "rgba(56, 189, 248," : "rgba(37, 99, 235,",
          });
        }

        prevMouseX = mouseX;
        prevMouseY = mouseY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      clickScale = 0.82; // Liquid orb compression
    };

    const handleMouseUp = (e: MouseEvent) => {
      isMouseDown = false;
      clickScale = 1.0;

      // Special interaction: Liquid burst ripple expands outward on click
      if (currentState !== "input" && ripples.length < MAX_RIPPLES) {
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 8,
          maxRadius: 46,
          alpha: isDark ? 0.55 : 0.4,
          maxAlpha: isDark ? 0.55 : 0.4,
          lineWidth: 2.0,
          color: isDark ? "rgba(56, 189, 248," : "rgba(37, 99, 235,",
        });

        // 4-5 tiny micro-burst droplets
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 + Math.random() * 0.3;
          const spd = 1.8 + Math.random() * 1.5;
          particles.push({
            x: e.clientX,
            y: e.clientY,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            radius: 3,
            maxRadius: 8,
            alpha: isDark ? 0.5 : 0.35,
            life: 0,
            maxLife: 20,
            color: isDark ? "rgba(56, 189, 248," : "rgba(37, 99, 235,",
            oscillation: 0,
          });
        }
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
      if (magneticElement) {
        magneticElement.style.transform = magneticOriginalTransform;
        magneticElement = null;
      }
    };

    const handleMouseEnter = () => {
      isVisible = true;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Initial positioning
    let targetBaseRadius = 16; // 32px base orb
    let currentRadius = 16;
    let orbAlpha = 0;

    // Helper: draw an organic closed fluid contour
    const drawOrganicLiquidRing = (
      cx: number,
      cy: number,
      baseR: number,
      t: number,
      wobbleIntensity: number
    ) => {
      const points = 18;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        // Natural multi-harmonic surface tension wave equation
        const wobble =
          1 +
          wobbleIntensity *
            (Math.sin(3 * theta + t * 2.8) * 0.055 +
              Math.cos(2 * theta - t * 1.9) * 0.045 +
              Math.sin(5 * theta + t * 3.4) * 0.025);
        const r = baseR * wobble;
        const px = cx + Math.cos(theta) * r;
        const py = cy + Math.sin(theta) * r;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
    };

    // Main 60fps Animation Loop
    let animId = 0;
    const render = () => {
      time += 0.035;

      // Smooth inertia lerping
      // 1. Dot follows almost instantly (lerp: 0.55)
      dotX += (mouseX - dotX) * 0.55;
      dotY += (mouseY - dotY) * 0.55;

      // 2. Liquid Orb follows with fluid spring inertia (lerp: 0.16)
      orbX += (mouseX - orbX) * 0.16;
      orbY += (mouseY - orbY) * 0.16;

      // Determine state radius & alpha
      if (!isVisible || currentState === "input") {
        orbAlpha += (0 - orbAlpha) * 0.2;
      } else {
        orbAlpha += ((currentState === "disabled" ? 0.25 : 1) - orbAlpha) * 0.15;
      }

      switch (currentState) {
        case "button":
          targetBaseRadius = 24; // 48px expanded
          break;
        case "card":
          targetBaseRadius = 28; // 56px soft expanded
          break;
        case "text":
          targetBaseRadius = 12; // 24px tighter
          break;
        case "link":
          targetBaseRadius = 20;
          break;
        case "disabled":
          targetBaseRadius = 10;
          break;
        default:
          targetBaseRadius = 16; // 32px standard
          break;
      }

      currentRadius += (targetBaseRadius * clickScale - currentRadius) * 0.15;

      ctx.clearRect(0, 0, width, height);

      // ─── 1. RENDER EXPANDING WATER RIPPLES ────────────────────────────
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += (r.maxRadius - r.radius) * 0.14;
        r.alpha *= 0.91;

        if (r.alpha < 0.01 || r.radius >= r.maxRadius - 1) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${r.color} ${r.alpha})`;
        ctx.lineWidth = r.lineWidth * (r.alpha / r.maxAlpha);
        ctx.stroke();
        ctx.restore();
      }

      // ─── 2. RENDER FLOWING WATER WAKE PARTICLES ──────────────────────
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.oscillation += 0.18;

        // Subtle organic drift
        p.x += p.vx + Math.sin(p.oscillation) * 0.35;
        p.y += p.vy + Math.cos(p.oscillation) * 0.35;

        const progress = p.life / p.maxLife;
        const currentAlpha = p.alpha * (1 - progress);
        const curRadius = p.radius + (p.maxRadius - p.radius) * progress;

        if (progress >= 1 || currentAlpha <= 0.005) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          curRadius
        );
        gradient.addColorStop(0, `${p.color} ${currentAlpha})`);
        gradient.addColorStop(0.65, `${p.color} ${currentAlpha * 0.35})`);
        gradient.addColorStop(1, `${p.color} 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, curRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ─── 3. RENDER LIQUID ENERGY ORB GRAPHIC ─────────────────────────
      if (orbAlpha > 0.01) {
        ctx.save();

        const baseR = currentRadius;
        const wobbleIntensity = currentState === "button" ? 1.4 : 1.0;

        // A. Soft blurred outer glow
        const glowRadius = baseR * 2.1;
        const glowGradient = ctx.createRadialGradient(
          orbX,
          orbY,
          baseR * 0.3,
          orbX,
          orbY,
          glowRadius
        );

        if (isDark) {
          glowGradient.addColorStop(0, `rgba(56, 189, 248, ${0.28 * orbAlpha})`);
          glowGradient.addColorStop(0.55, `rgba(99, 102, 241, ${0.1 * orbAlpha})`);
          glowGradient.addColorStop(1, "rgba(56, 189, 248, 0)");
        } else {
          glowGradient.addColorStop(0, `rgba(2, 132, 199, ${0.22 * orbAlpha})`);
          glowGradient.addColorStop(0.6, `rgba(37, 99, 235, ${0.08 * orbAlpha})`);
          glowGradient.addColorStop(1, "rgba(2, 132, 199, 0)");
        }

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(orbX, orbY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // B. Translucent wobbling liquid membrane fill
        drawOrganicLiquidRing(orbX, orbY, baseR, time, wobbleIntensity);
        ctx.fillStyle = isDark
          ? `rgba(56, 189, 248, ${0.12 * orbAlpha})`
          : `rgba(2, 132, 199, ${0.08 * orbAlpha})`;
        ctx.fill();

        // C. Animated outer caustic water boundary line
        ctx.strokeStyle = isDark
          ? `rgba(56, 189, 248, ${0.65 * orbAlpha})`
          : `rgba(2, 132, 199, ${0.55 * orbAlpha})`;
        ctx.lineWidth = 1.35;
        ctx.stroke();

        // D. Inner caustic refraction ring (oscillates out of phase for depth)
        drawOrganicLiquidRing(orbX, orbY, baseR * 0.58, time * 1.35 + 1.2, wobbleIntensity * 0.85);
        ctx.strokeStyle = isDark
          ? `rgba(125, 211, 252, ${0.45 * orbAlpha})`
          : `rgba(14, 165, 233, ${0.35 * orbAlpha})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // E. Bright central blue/cyan energy dot (pinpoint precision)
        const dotCoreR = 2.4;
        const dotHaloR = 6.0;

        // Dot halo
        const dotHaloGradient = ctx.createRadialGradient(
          dotX,
          dotY,
          0,
          dotX,
          dotY,
          dotHaloR
        );
        if (isDark) {
          dotHaloGradient.addColorStop(0, `rgba(56, 189, 248, ${0.85 * orbAlpha})`);
          dotHaloGradient.addColorStop(0.7, `rgba(56, 189, 248, ${0.35 * orbAlpha})`);
          dotHaloGradient.addColorStop(1, "rgba(56, 189, 248, 0)");
        } else {
          dotHaloGradient.addColorStop(0, `rgba(2, 132, 199, ${0.75 * orbAlpha})`);
          dotHaloGradient.addColorStop(0.7, `rgba(37, 99, 235, ${0.3 * orbAlpha})`);
          dotHaloGradient.addColorStop(1, "rgba(2, 132, 199, 0)");
        }
        ctx.fillStyle = dotHaloGradient;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotHaloR, 0, Math.PI * 2);
        ctx.fill();

        // Dot solid core
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${0.95 * orbAlpha})`
          : `rgba(2, 132, 199, ${0.9 * orbAlpha})`;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotCoreR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      themeObserver.disconnect();
      if (magneticElement) {
        magneticElement.style.transform = magneticOriginalTransform;
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[99999] select-none"
      style={{
        mixBlendMode: "normal",
      }}
      aria-hidden="true"
    />
  );
};
