"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { CenterpieceModel } from "./CenterpieceModel";
import { TextLayer3D } from "./TextLayer3D";
import type { TemplateSceneProps } from "../templates/types";
import type { SlotAsset } from "../types/editor";
import {
  DoubleSide,
  Object3D,
  Vector2,
} from "three";
import { useSceneBackgroundParams } from "../hooks/useSceneBackgroundParams";
import { SceneBackground } from "./scene/SceneBackground";
import { useDeterministicAngle } from "../hooks/useDeterministicAngle";

function AlwaysInvalidate() {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      invalidate();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [invalidate]);

  return null;
}

function ImageSphere({
  spinVelocityXRef,
  spinVelocityYRef,
  angleXRef,
  angleYRef,
  isDraggingRef,
  snapActiveRef,
  snapTargetXRef,
  snapTargetYRef,
  playbackMode = "interactive",
  progress = 0,
  onTileDirs,
  onHover,
  onUnhover,
}: {
  spinVelocityXRef: React.MutableRefObject<number>;
  spinVelocityYRef: React.MutableRefObject<number>;
  angleXRef: React.MutableRefObject<number>;
  angleYRef: React.MutableRefObject<number>;
  isDraggingRef: React.MutableRefObject<boolean>;
  snapActiveRef: React.MutableRefObject<boolean>;
  snapTargetXRef: React.MutableRefObject<number>;
  snapTargetYRef: React.MutableRefObject<number>;
  playbackMode?: "interactive" | "auto";
  progress?: number;
  onTileDirs: (dirs: Array<{ x: number; y: number; z: number }>) => void;
  onHover?: (name: string) => void;
  onUnhover?: () => void;
}) {
  const groupRef = useRef<Object3D>(null);

  const storeImages = useEditorStore((s) => s.images);
  const imageUrls = useMemo(
    () => (storeImages.length > 0 ? storeImages.map((img) => img.url) : ["/tube/im1.jpg"]),
    [storeImages],
  );

  const textures = useTexture(imageUrls);

  const projectNames = useMemo(() => {
    if (storeImages.length > 0) {
      return storeImages.map((img) => img.name);
    }
    const fileToName: Record<string, string> = {
      "/tube/im1.jpg": "Project 1",
    };
    return imageUrls.map((url) => fileToName[url] ?? url);
  }, [storeImages, imageUrls]);

  const storeRadius = useEditorStore((s) => s.templateParams.radius);
  const storeCount = useEditorStore((s) => s.templateParams.count);
  const radius = typeof storeRadius === "number" ? storeRadius : 4.25;
  const tileW = 0.72;
  const tileH = 1.0;
  const tileCount = typeof storeCount === "number" ? storeCount : imageUrls.length * 8;

  const tiles = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; texIndex: number }> = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const n = Math.max(1, tileCount);

    for (let i = 0; i < n; i++) {
      const t = n <= 1 ? 0.5 : i / (n - 1);
      const y = 1 - t * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      out.push({ x: x * radius, y: y * radius * 0.92, z: z * radius, texIndex: i % imageUrls.length });
    }

    return out;
  }, [imageUrls.length, radius, tileCount]);

  useEffect(() => {
    onTileDirs(
      tiles.map(({ x, y, z }) => {
        const len = Math.hypot(x, y, z) || 1;
        return { x: x / len, y: y / len, z: z / len };
      }),
    );
  }, [onTileDirs, tiles]);

  const wrapPi = useCallback((a: number) => {
    const twoPi = Math.PI * 2;
    let v = (a + Math.PI) % twoPi;
    if (v < 0) v += twoPi;
    return v - Math.PI;
  }, []);

  const stepAngle = useCallback(
    (current: number, target: number, alpha: number, wrap: boolean) => {
      const diff = wrap ? wrapPi(target - current) : target - current;
      return current + diff * alpha;
    },
    [wrapPi],
  );

  const autoProgress = useDeterministicAngle(angleYRef, playbackMode, progress, 1.0);

  useFrame((_state, dt) => {
    if (autoProgress()) {
      angleXRef.current = 0;
      const group = groupRef.current;
      if (group) {
        group.rotation.x = angleXRef.current;
        group.rotation.y = angleYRef.current;
      }
      return;
    }

    const damping = 0.92;
    spinVelocityXRef.current *= Math.pow(damping, dt * 60);
    spinVelocityYRef.current *= Math.pow(damping, dt * 60);

    spinVelocityXRef.current = Math.max(-3.0, Math.min(3.0, spinVelocityXRef.current));
    spinVelocityYRef.current = Math.max(-3.0, Math.min(3.0, spinVelocityYRef.current));

    const storeBaseSpeed = (useEditorStore.getState().templateParams.baseSpeed as number) ?? 0;
    const baseIdleSpeed = !snapActiveRef.current && !isDraggingRef.current ? storeBaseSpeed : 0;
    angleXRef.current += spinVelocityXRef.current * dt;
    angleYRef.current += (baseIdleSpeed + spinVelocityYRef.current) * dt;

    const maxPitch = 0.9;
    if (angleXRef.current > maxPitch) angleXRef.current = maxPitch;
    if (angleXRef.current < -maxPitch) angleXRef.current = -maxPitch;

    if (snapActiveRef.current && !isDraggingRef.current) {
      spinVelocityXRef.current *= 0.92;
      spinVelocityYRef.current *= 0.92;

      const alpha = 1 - Math.pow(0.92, dt * 60);
      angleXRef.current = stepAngle(angleXRef.current, snapTargetXRef.current, alpha, false);
      angleYRef.current = stepAngle(angleYRef.current, snapTargetYRef.current, alpha, true);

      const yawErr = Math.abs(wrapPi(snapTargetYRef.current - angleYRef.current));
      const pitchErr = Math.abs(snapTargetXRef.current - angleXRef.current);
      if (yawErr < 0.0025 && pitchErr < 0.0025) {
        angleXRef.current = snapTargetXRef.current;
        angleYRef.current += wrapPi(snapTargetYRef.current - angleYRef.current);
        spinVelocityXRef.current = 0;
        spinVelocityYRef.current = 0;
        snapActiveRef.current = false;
      }
    }

    const group = groupRef.current;
    if (group) {
      group.rotation.x = angleXRef.current;
      group.rotation.y = angleYRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      {tiles.map(({ x, y, z, texIndex }, index) => {
        const name = projectNames[texIndex % projectNames.length];
        return (
          <mesh
            key={index}
            position={[x, y, z]}
            ref={(obj) => {
              if (!obj) return;
              obj.lookAt(0, 0, 0);
            }}
            onPointerOver={(e) => {
              if (playbackMode !== "interactive") return;
              e.stopPropagation();
              onHover?.(name);
            }}
            onPointerOut={(e) => {
              if (playbackMode !== "interactive") return;
              e.stopPropagation();
              onUnhover?.();
            }}
          >
            <planeGeometry args={[tileW, tileH]} />
            <meshBasicMaterial
              map={Array.isArray(textures) ? textures[texIndex % textures.length] : textures}
              toneMapped={false}
              side={DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function CodropScene({ playbackMode = "interactive", progress = 0 }: TemplateSceneProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetCenterUv = useRef(new Vector2(0.5, 0.5));

  const easing = useEditorStore((s) => s.easing || (s.templateParams.easing as string) || "power1.inOut");

  const sphereSpinVelocityX = useRef(0);
  const sphereSpinVelocityY = useRef(0);
  const sphereAngleX = useRef(0);
  const sphereAngleY = useRef(0);

  const isDraggingRef = useRef(false);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragLastXRef = useRef(0);
  const dragLastYRef = useRef(0);
  const dragLastTRef = useRef(0);

  const tileDirsRef = useRef<Array<{ x: number; y: number; z: number }>>([]);
  const snapActiveRef = useRef(false);
  const snapTargetXRef = useRef(0);
  const snapTargetYRef = useRef(0);

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const tooltipElRef = useRef<HTMLDivElement | null>(null);
  const tooltipTarget = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipCurrent = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRaf = useRef<number | null>(null);

  const cursorElRef = useRef<HTMLDivElement | null>(null);
  const cursorTarget = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cursorCurrent = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cursorActive = useRef(false);
  const cursorRaf = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const el = cursorElRef.current;
      if (el) {
        const lerp = 0.14;
        cursorCurrent.current.x += (cursorTarget.current.x - cursorCurrent.current.x) * lerp;
        cursorCurrent.current.y += (cursorTarget.current.y - cursorCurrent.current.y) * lerp;

        const x = cursorCurrent.current.x + 8;
        const y = cursorCurrent.current.y + 8;
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%)`;
        el.style.opacity = cursorActive.current ? "1" : "0";
      }

      cursorRaf.current = requestAnimationFrame(tick);
    };

    cursorRaf.current = requestAnimationFrame(tick);
    return () => {
      if (cursorRaf.current != null) cancelAnimationFrame(cursorRaf.current);
    };
  }, []);

  const setTooltipFromClientPoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    tooltipTarget.current = { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  useEffect(() => {
    const tick = () => {
      const el = tooltipElRef.current;
      if (el) {
        const lerp = 0.18;
        tooltipCurrent.current.x += (tooltipTarget.current.x - tooltipCurrent.current.x) * lerp;
        tooltipCurrent.current.y += (tooltipTarget.current.y - tooltipCurrent.current.y) * lerp;

        const x = tooltipCurrent.current.x + 12;
        const y = tooltipCurrent.current.y - 18;
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }

      tooltipRaf.current = requestAnimationFrame(tick);
    };

    tooltipRaf.current = requestAnimationFrame(tick);
    return () => {
      if (tooltipRaf.current != null) cancelAnimationFrame(tooltipRaf.current);
    };
  }, []);

  const textFontSize = (useEditorStore((s) => s.templateParams.textFontSize) as number) ?? 0.6;
  const textColor = (useEditorStore((s) => s.templateParams.textColor) as string) ?? "#ffffff";
  const textPositionX = (useEditorStore((s) => s.templateParams.textPositionX) as number) ?? 0;
  const textPositionY = (useEditorStore((s) => s.templateParams.textPositionY) as number) ?? 0;
  const textPositionZ = (useEditorStore((s) => s.templateParams.textPositionZ) as number) ?? 0.5;

  const bgParams = useSceneBackgroundParams();

  const assetsBySlot = useEditorStore((s) => s.assetsBySlot);
  const textAsset = useMemo(() => {
    const assets = assetsBySlot["text"] || assetsBySlot["title"] || [];
    return assets.find((a): a is Extract<SlotAsset, { kind: "text" }> => a.kind === "text");
  }, [assetsBySlot]);

  return (
    <div
      className={`sceneRoot ${bgParams.transparentBackground ? "sceneRoot--transparent" : ""}`}
      ref={containerRef}
      style={{ pointerEvents: playbackMode === "interactive" ? "auto" : "none" }}
      onPointerDown={(e) => {
        if (playbackMode !== "interactive") return;
        isDraggingRef.current = true;
        dragPointerIdRef.current = e.pointerId;
        dragLastXRef.current = e.clientX;
        dragLastYRef.current = e.clientY;
        dragLastTRef.current = performance.now();
        snapActiveRef.current = false;
        try {
          (containerRef.current as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerMove={(e) => {
        if (playbackMode !== "interactive") return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cursorTarget.current = { x, y };
        setTooltipFromClientPoint(e.clientX, e.clientY);
        targetCenterUv.current.set(x / rect.width, 1.0 - y / rect.height);

        if (isDraggingRef.current && dragPointerIdRef.current === e.pointerId) {
          const now = performance.now();
          const dt = now - dragLastTRef.current;
          const dx = e.clientX - dragLastXRef.current;
          const dy = e.clientY - dragLastYRef.current;
          dragLastXRef.current = e.clientX;
          dragLastYRef.current = e.clientY;
          dragLastTRef.current = now;

          if (dt > 0) {
            sphereSpinVelocityY.current = (dx / dt) * 15;
            sphereSpinVelocityX.current = -(dy / dt) * 15;
          }
          sphereAngleY.current += dx * 0.005;
          sphereAngleX.current -= dy * 0.005;
        }
      }}
      onPointerUp={(e) => {
        if (playbackMode !== "interactive") return;
        isDraggingRef.current = false;
        dragPointerIdRef.current = null;
        try {
          (containerRef.current as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerCancel={(e) => {
        if (playbackMode !== "interactive") return;
        isDraggingRef.current = false;
        dragPointerIdRef.current = null;
        try {
          (containerRef.current as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerEnter={() => {
        if (playbackMode !== "interactive") return;
        cursorActive.current = true;
      }}
      onPointerLeave={() => {
        if (playbackMode !== "interactive") return;
        cursorActive.current = false;
        setHoveredProject(null);
      }}
    >
      <Canvas
        gl={{ alpha: true, preserveDrawingBuffer: true, antialias: true }}
        frameloop="always"
        camera={{ position: [0, 0, 6.5], fov: 50 }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
        }}
      >
        <Suspense fallback={null}>
          <AlwaysInvalidate />
          <SceneBackground
            {...bgParams}
            targetCenterUv={targetCenterUv}
            progress={progress}
            playbackMode={playbackMode}
            easing={easing}
          />

          <ImageSphere
            spinVelocityXRef={sphereSpinVelocityX}
            spinVelocityYRef={sphereSpinVelocityY}
            angleXRef={sphereAngleX}
            angleYRef={sphereAngleY}
            isDraggingRef={isDraggingRef}
            snapActiveRef={snapActiveRef}
            snapTargetXRef={snapTargetXRef}
            snapTargetYRef={snapTargetYRef}
            playbackMode={playbackMode}
            progress={progress}
            onTileDirs={(dirs) => {
              tileDirsRef.current = dirs;
            }}
            onHover={setHoveredProject}
            onUnhover={() => setHoveredProject(null)}
          />

          <CenterpieceModel
            fallbackModelUrl="/models/helmet.glb"
            materialParams={{
              transmission: 1,
              thickness: 10,
              roughness: 0,
              metalness: 0.1,
              ior: 1.9,
              dispersion: 1,
              clearcoat: 0.1,
              clearcoatRoughness: 1.1,
              color: "#ffffff",
              transparent: true,
              depthWrite: true,
            }}
            angleRef={sphereAngleY}
          />

          {textAsset?.content && (
            <TextLayer3D
              content={textAsset.content}
              fontUrl={textAsset?.fontUrl}
              position={[textPositionX, textPositionY, textPositionZ]}
              color={textColor}
              fontSize={textFontSize}
            />
          )}
        </Suspense>
      </Canvas>

      <div className="whiteEdgeGradient" aria-hidden="true" />

      {hoveredProject && (
        <div className="projectTooltip" ref={tooltipElRef} role="status" aria-live="polite">
          {hoveredProject}
        </div>
      )}

      <div className="customCursor" ref={cursorElRef} aria-hidden="true" />
    </div>
  );
}

useGLTF.preload("/models/helmet.glb");
