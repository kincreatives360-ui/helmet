"use client";

import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { CenterpieceModel } from "./CenterpieceModel";
import { TextLayer3D } from "./TextLayer3D";
import type { TemplateSceneProps } from "../templates/types";
import type { SlotAsset } from "../types/editor";
import { DoubleSide, Object3D, Vector2 } from "three";
import { useSceneBackgroundParams } from "../hooks/useSceneBackgroundParams";
import { SceneBackground } from "./scene/SceneBackground";
import { useDeterministicAngle } from "../hooks/useDeterministicAngle";

function ImageTube({
  scrollTargetRef,
  spinVelocityRef,
  naturalDirRef,
  tubeAngleRef,
  idleSpinEnabled,
  playbackMode = "interactive",
  progress = 0,
  onHover,
  onUnhover,
  onClickProject,
}: {
  scrollTargetRef: React.MutableRefObject<number>;
  spinVelocityRef: React.MutableRefObject<number>;
  naturalDirRef: React.MutableRefObject<number>;
  tubeAngleRef: React.MutableRefObject<number>;
  idleSpinEnabled: React.MutableRefObject<boolean>;
  playbackMode?: "interactive" | "auto";
  progress?: number;
  onHover?: (name: string, imageUrl: string) => void;
  onUnhover?: () => void;
  onClickProject?: (name: string, imageUrl: string, index: number) => void;
}) {
  const groupRef = useRef<Object3D>(null);
  const rowGroupRefs = useRef<Array<Object3D | null>>([]);
  const scrollCurrent = useRef(0);
  const angle = useRef(0);
  const isHovering = useRef(false);
  const speedMultiplier = useRef(1);

  const storeImages = useEditorStore((s) => s.images);
  const imageUrls = useMemo(
    () =>
      storeImages.length > 0
        ? storeImages.map((img) => img.url)
        : [
            "/tube/img1.jpg",
            "/tube/img3.jpg",
            "/tube/img2.jpg",
            "/tube/img4.jpg",
            "/tube/img5.jpg",
            "/tube/img6.jpg",
            "/tube/img9.jpg",
          ],
    [storeImages],
  );

  const textures = useTexture(imageUrls);

  const projectNames = useMemo(() => {
    if (storeImages.length > 0) {
      return storeImages.map((img) => img.name);
    }
    const fileToName: Record<string, string> = {
      "/tube/img1.jpg": "Golden Hour",
      "/tube/img3.jpg": "Abstract Whispers",
      "/tube/img2.jpg": "Velvet Dunes",
      "/tube/img4.jpg": "Cyberpunk Neon",
      "/tube/img5.jpg": "Crimson Canopy",
      "/tube/img6.jpg": "Emerald Dawn",
      "/tube/img9.jpg": "Oceanic Echoes",
    };
    return imageUrls.map((url) => fileToName[url] ?? url);
  }, [storeImages, imageUrls]);

  const storeCount = useEditorStore((s) => s.templateParams.count);
  const count = typeof storeCount === "number" ? storeCount : 24;
  const cols = 6;
  const rows = Math.max(1, Math.round(count / cols));
  const radius = 4;
  const tileW = 0.72;
  const tileH = 1;
  const ySpacing = 2.7;
  const loopHeight = rows * ySpacing;
  const repeatCount = 3;
  const totalRows = rows * repeatCount;

  const rowSpeed = useMemo(() => {
    const speeds: number[] = [];
    for (let r = 0; r < rows; r++) {
      const t = rows <= 1 ? 0 : r / (rows - 1);
      speeds.push(0.65 + t * 0.9);
    }
    return speeds;
  }, [rows]);

  const rowPositions = useMemo(() => {
    const out: Array<{ rowIndex: number; y: number; baseRow: number; rowOffset: number }> = [];
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const y = (rowIndex - (totalRows - 1) / 2) * ySpacing;
      const baseRow = rowIndex % rows;
      const rowOffset = baseRow % 2 === 0 ? 0 : 0.5;
      out.push({ rowIndex, y, baseRow, rowOffset });
    }
    return out;
  }, [rows, totalRows, ySpacing]);

  const autoProgress = useDeterministicAngle(angle, playbackMode, progress, 1.0);

  useFrame((_state, dt) => {
    if (autoProgress()) {
      tubeAngleRef.current = angle.current;

      const group = groupRef.current;
      if (!group) return;
      group.position.y = 0;

      for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        const rowObj = rowGroupRefs.current[rowIndex];
        if (!rowObj) continue;
        const baseRow = rowIndex % rows;
        rowObj.rotation.y = angle.current * rowSpeed[baseRow];
      }
      return;
    }

    scrollCurrent.current += (scrollTargetRef.current - scrollCurrent.current) * 0.12;

    if (scrollCurrent.current > loopHeight / 2) {
      scrollCurrent.current -= loopHeight;
      scrollTargetRef.current -= loopHeight;
    } else if (scrollCurrent.current < -loopHeight / 2) {
      scrollCurrent.current += loopHeight;
      scrollTargetRef.current += loopHeight;
    }

    const targetMultiplier = isHovering.current ? 0.05 : 1;
    speedMultiplier.current += (targetMultiplier - speedMultiplier.current) * 0.1;

    const damping = 0.92;
    spinVelocityRef.current *= Math.pow(damping, dt * 60);
    spinVelocityRef.current = Math.max(-2.0, Math.min(2.0, spinVelocityRef.current));

    const storeBaseSpeed = (useEditorStore.getState().templateParams.baseSpeed as number) ?? 0;
    const baseSpeed = idleSpinEnabled.current ? naturalDirRef.current * storeBaseSpeed * speedMultiplier.current : 0;
    angle.current += (baseSpeed + spinVelocityRef.current * speedMultiplier.current) * dt;
    tubeAngleRef.current = angle.current;

    const group = groupRef.current;
    if (!group) return;

    group.position.y = -scrollCurrent.current;

    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const rowObj = rowGroupRefs.current[rowIndex];
      if (!rowObj) continue;
      const baseRow = rowIndex % rows;
      rowObj.rotation.y = angle.current * rowSpeed[baseRow];
    }
  });

  return (
    <group ref={groupRef}>
      {rowPositions.map(({ rowIndex, y, baseRow, rowOffset }) => (
        <group
          key={rowIndex}
          position={[0, y, 0]}
          ref={(obj) => {
            rowGroupRefs.current[rowIndex] = obj;
          }}
        >
          {Array.from({ length: cols }).map((_, col) => {
            const theta = ((col + rowOffset) / cols) * Math.PI * 2;
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            const ry = -(theta + Math.PI / 2);
            const texIndex = (baseRow * cols + col) % imageUrls.length;

            const name = projectNames[texIndex % projectNames.length];
            const imageUrl = imageUrls[texIndex % imageUrls.length];

            return (
              <mesh
                key={col}
                position={[x, 0, z]}
                rotation={[0, ry, 0]}
                onPointerOver={(e) => {
                  if (playbackMode !== "interactive") return;
                  e.stopPropagation();
                  isHovering.current = true;
                  onHover?.(name, imageUrl);
                }}
                onPointerOut={(e) => {
                  if (playbackMode !== "interactive") return;
                  e.stopPropagation();
                  isHovering.current = false;
                  onUnhover?.();
                }}
                onClick={(e) => {
                  if (playbackMode !== "interactive") return;
                  e.stopPropagation();
                  onClickProject?.(name, imageUrl, texIndex);
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
      ))}
    </group>
  );
}

export function RubensScene({ playbackMode = "interactive", progress = 0 }: TemplateSceneProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetCenterUv = useRef(new Vector2(0.5, 0.5));
  const tubeScrollTarget = useRef(0);
  const tubeSpinVelocity = useRef(0);
  const tubeNaturalDir = useRef(1);
  const tubeAngle = useRef(0);
  const idleSpinEnabled = useRef(true);

  const easing = useEditorStore((s) => s.easing || (s.templateParams.easing as string) || "power1.inOut");

  const bgParams = useSceneBackgroundParams();

  const textFontSize = (useEditorStore((s) => s.templateParams.textFontSize) as number) ?? 0.6;
  const textColor = (useEditorStore((s) => s.templateParams.textColor) as string) ?? "#e2ba80";
  const textPositionX = (useEditorStore((s) => s.templateParams.textPositionX) as number) ?? 0;
  const textPositionY = (useEditorStore((s) => s.templateParams.textPositionY) as number) ?? 0;
  const textPositionZ = (useEditorStore((s) => s.templateParams.textPositionZ) as number) ?? 0.5;

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [hoveredImageUrl, setHoveredImageUrl] = useState<string | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [selectedProject, setSelectedProject] = useState<{
    name: string;
    imageUrl: string;
    index: number;
  } | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const openOverlayTimeoutRef = useRef<number | null>(null);
  const closeOverlayTimeoutRef = useRef<number | null>(null);

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

  const handleHover = useCallback((name: string, imageUrl: string) => {
    setHoveredProject(name);
    setPreviousImageUrl(hoveredImageUrl);
    setHoveredImageUrl(imageUrl);
  }, [hoveredImageUrl]);

  const handleUnhover = useCallback(() => {
    setHoveredProject(null);
    setPreviousImageUrl(hoveredImageUrl);
    setHoveredImageUrl(null);
  }, [hoveredImageUrl]);

  const handleClickProject = useCallback((name: string, imageUrl: string, index: number) => {
    setSelectedProject({ name, imageUrl, index });
    setShowOverlay(true);
  }, []);

  const handleCloseProject = useCallback(() => {
    setShowOverlay(false);

    if (closeOverlayTimeoutRef.current != null) window.clearTimeout(closeOverlayTimeoutRef.current);
    closeOverlayTimeoutRef.current = window.setTimeout(() => {
      setSelectedProject(null);
    }, 1200);
  }, []);

  useEffect(() => {
    if (hoveredImageUrl && previousImageUrl) {
      const timer = setTimeout(() => {
        setPreviousImageUrl(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hoveredImageUrl, previousImageUrl]);

  useEffect(() => {
    const openTimeout = openOverlayTimeoutRef.current;
    const closeTimeout = closeOverlayTimeoutRef.current;
    return () => {
      if (openTimeout != null) window.clearTimeout(openTimeout);
      if (closeTimeout != null) window.clearTimeout(closeTimeout);
    };
  }, []);

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
      onPointerMove={(e) => {
        if (playbackMode !== "interactive") return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cursorTarget.current = { x, y };
        setCursorPos({ x, y });
        targetCenterUv.current.set(x / rect.width, 1.0 - y / rect.height);
      }}
      onPointerEnter={() => {
        if (playbackMode !== "interactive") return;
        cursorActive.current = true;
      }}
      onPointerLeave={() => {
        if (playbackMode !== "interactive") return;
        cursorActive.current = false;
        handleUnhover();
      }}
    >
      {!bgParams.transparentBackground && previousImageUrl && (
        <div
          className="background-image-blur background-image-previous"
          style={{ backgroundImage: `url(${previousImageUrl})` }}
        />
      )}
      {!bgParams.transparentBackground && hoveredImageUrl && (
        <div
          className="background-image-blur background-image-current"
          style={{ backgroundImage: `url(${hoveredImageUrl})` }}
        />
      )}

      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        frameloop="always"
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
        }}
      >
        <Suspense fallback={null}>
          <SceneBackground
            {...bgParams}
            targetCenterUv={targetCenterUv}
            progress={progress}
            playbackMode={playbackMode}
            easing={easing}
          />

          <ImageTube
            scrollTargetRef={tubeScrollTarget}
            spinVelocityRef={tubeSpinVelocity}
            naturalDirRef={tubeNaturalDir}
            tubeAngleRef={tubeAngle}
            idleSpinEnabled={idleSpinEnabled}
            playbackMode={playbackMode}
            progress={progress}
            onHover={handleHover}
            onUnhover={handleUnhover}
            onClickProject={handleClickProject}
          />

          <CenterpieceModel
            fallbackModelUrl="/models/rubens.glb"
            materialParams={{
              color: "#613309",
              metalness: 0.9,
              roughness: 0.3,
              envMapIntensity: 0.1,
              clearcoat: 0.3,
              clearcoatRoughness: 0.4,
            }}
            angleRef={tubeAngle}
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

      {selectedProject && (
        <div
          className={`project-single-view ${showOverlay ? "visible" : "hidden"}`}
          style={{ backgroundImage: `url(${selectedProject.imageUrl})` }}
        >
          <button className="close-button" onClick={handleCloseProject}>
            ✕
          </button>
          <div className="project-content">
            <Image
              src={selectedProject.imageUrl}
              alt={selectedProject.name}
              width={1200}
              height={800}
              sizes="(max-width: 768px) 90vw, 700px"
              referrerPolicy="no-referrer"
              style={{ width: "100%", height: "auto" }}
            />
            <h1>{selectedProject.name}</h1>
          </div>
        </div>
      )}

      {hoveredProject && hoveredImageUrl && (
        <div
          className="project-label"
          style={{
            left: `${cursorPos.x + 20}px`,
            top: `${cursorPos.y + 20}px`,
          }}
        >
          <div className="project-thumbnail" style={{ backgroundImage: `url(${hoveredImageUrl})` }} />
          <div className="project-name">{hoveredProject}</div>
        </div>
      )}

      <div className="whiteEdgeGradient" aria-hidden="true" />
      <div className="customCursor" ref={cursorElRef} aria-hidden="true" />
    </div>
  );
}

useGLTF.preload("/models/rubens.glb");