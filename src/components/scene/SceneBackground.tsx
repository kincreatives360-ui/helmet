"use client";

import { Suspense, useMemo, useRef } from "react";
import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Color, Vector2, Mesh, ShaderMaterial, DoubleSide } from "three";
import { getEasedProgress } from "../../lib/easing";
import { useSceneBackgroundParams } from "../../hooks/useSceneBackgroundParams";

const ENVIRONMENT_FILES: Record<string, string> = {
  city: "potsdamer_platz_1k.hdr",
  dawn: "kiara_1_dawn_1k.hdr",
  forest: "forest_slope_1k.hdr",
  lobby: "st_fagans_interior_1k.hdr",
  night: "dikhololo_night_1k.hdr",
  park: "rooitou_park_1k.hdr",
  studio: "studio_small_03_1k.hdr",
  sunset: "venice_sunset_1k.hdr",
  warehouse: "empty_warehouse_01_1k.hdr",
  workshop: "abandoned_workshop_01_1k.hdr",
};

function SceneEnvironment({
  preset = "studio",
  blur = 0.5,
}: {
  preset?: string;
  blur?: number;
}) {
  if (preset === "none") {
    return (
      <>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={1.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.6} />
      </>
    );
  }

  const normalizedBlur = Math.max(0, Math.min(1, blur <= 1 ? blur : blur / 20));
  const filename = ENVIRONMENT_FILES[preset] || "studio_small_03_1k.hdr";
  const fileUrl = `https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/hdri/${filename}`;

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <directionalLight position={[-5, -3, -5]} intensity={0.6} color="#a0c4ff" />
      <pointLight position={[0, 4, 3]} intensity={1.0} />
      <pointLight position={[0, -4, -3]} intensity={0.5} color="#ffd166" />
      <Suspense fallback={null}>
        <Environment
          files={fileUrl}
          blur={normalizedBlur}
        />
      </Suspense>
    </>
  );
}

function GridPlane({
  targetCenterUv,
  gridScale = 28,
  gridLineWidth = 0.5,
  gridColor = "#1a1a1a",
  backgroundColor = "#000000",
  transparent = false,
  progress = 0,
  playbackMode = "auto",
  easing = "power1.inOut",
}: {
  targetCenterUv: React.MutableRefObject<Vector2>;
  gridScale?: number;
  gridLineWidth?: number;
  gridColor?: string;
  backgroundColor?: string;
  transparent?: boolean;
  progress?: number;
  playbackMode?: "interactive" | "auto";
  easing?: string;
}) {
  const meshRef = useRef<Mesh>(null);
  const colorLine = useMemo(() => new Color(gridColor), [gridColor]);
  const colorBase = useMemo(() => new Color(backgroundColor), [backgroundColor]);

  const uniforms = useMemo(
    () => ({
      uGridScale: { value: gridScale },
      uLineWidth: { value: gridLineWidth },
      uLineColor: { value: colorLine },
      uBaseColor: { value: colorBase },
      uTransparent: { value: transparent ? 1.0 : 0.0 },
      uEdgeWidth: { value: 0.14 },
      uEdgeAmp: { value: 1.35 },
      uCenterRadius: { value: 0.22 },
      uCenterAmp: { value: 0.9 },
      uCenter: { value: new Vector2(0.5, 0.5) },
      uTime: { value: 0.0 },
      uScrollSpeed: { value: 0.01 },
      uResolution: { value: new Vector2(1, 1) },
    }),
    [gridScale, gridLineWidth, colorLine, colorBase, transparent],
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const material = mesh.material as ShaderMaterial;

    material.uniforms.uGridScale.value = gridScale;
    material.uniforms.uLineWidth.value = gridLineWidth;
    (material.uniforms.uLineColor.value as Color).set(gridColor);
    (material.uniforms.uBaseColor.value as Color).set(backgroundColor);
    material.uniforms.uTransparent.value = transparent ? 1.0 : 0.0;
    
    const eased = getEasedProgress(progress, easing);
    material.uniforms.uTime.value = playbackMode === "auto" ? eased * 10.0 : state.clock.getElapsedTime();
    (material.uniforms.uCenter.value as Vector2).lerp(targetCenterUv.current, 0.08);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5.2]}>
      <planeGeometry args={[18, 18, 256, 256]} />
      <shaderMaterial
        attach="material"
        transparent={transparent}
        depthWrite={!transparent}
        args={[
          {
            uniforms,
            vertexShader: `
                varying vec2 vUv;
                
                uniform float uEdgeWidth;
                uniform float uEdgeAmp;
                uniform float uCenterRadius;
                uniform float uCenterAmp;
                uniform vec2 uCenter;

                void main() {
                  vUv = uv;
                  vec3 p = position;

                  float dEdge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
                  float edgeW = max(uEdgeWidth, 0.001);
                  float edgeMask = 1.0 - smoothstep(0.0, edgeW, dEdge);

                  float dCenter = distance(vUv, uCenter);
                  float centerR = max(uCenterRadius, 0.001);
                  float centerMask = 1.0 - smoothstep(0.0, centerR, dCenter);

                  float zOffset = edgeMask * uEdgeAmp + centerMask * uCenterAmp;
                  p.z += zOffset;

                  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                }
              `,
            fragmentShader: `
                varying vec2 vUv;
                
                uniform float uGridScale;
                uniform float uLineWidth;
                uniform vec3 uLineColor;
                uniform vec3 uBaseColor;
                uniform float uTransparent;
                uniform float uTime;
                uniform float uScrollSpeed;
                uniform vec2 uResolution;

                float gridLine(float coord, float width) {
                  float fw = max(fwidth(coord), 0.0001);
                  float p = abs(fract(coord - 0.5) - 0.5);
                  float w0 = max(width * fw, 0.0001);
                  float w1 = max((width + 1.0) * fw, w0 + 0.0001);
                  return 1.0 - smoothstep(w0, w1, p);
                }

                void main() {
                  vec2 uv = (vUv + vec2(uTime * uScrollSpeed, 0.0)) * uGridScale;
                  float gx = gridLine(uv.x, uLineWidth);
                  float gy = gridLine(uv.y, uLineWidth);
                  float g = max(gx, gy);

                  if (uTransparent > 0.5) {
                    gl_FragColor = vec4(uLineColor, g);
                  } else {
                    vec3 col = mix(uBaseColor, uLineColor, g);
                    gl_FragColor = vec4(col, 1.0);
                  }
                }
              `,
            side: DoubleSide,
          },
        ]}
      />
    </mesh>
  );
}

function CameraRig({ parallaxFactor = 0.3 }: { parallaxFactor?: number }) {
  const initialPos = useRef<[number, number, number] | null>(null);

  useFrame(({ camera, pointer }) => {
    if (!initialPos.current) {
      initialPos.current = [camera.position.x, camera.position.y, camera.position.z];
    }
    if (parallaxFactor <= 0) return;

    const [bx, by] = initialPos.current;
    const targetX = bx + pointer.x * (parallaxFactor * 0.5);
    const targetY = by + pointer.y * (parallaxFactor * 0.35);

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
  });

  return null;
}

export function SceneBackground({
  gridScale,
  gridLineWidth,
  gridColor,
  backgroundColor,
  showGrid,
  transparentBackground,
  environmentPreset,
  environmentBlur,
  cameraParallax = 0.3,
  targetCenterUv,
  progress = 0,
  playbackMode = "auto",
  easing = "power1.inOut",
}: ReturnType<typeof useSceneBackgroundParams> & {
  targetCenterUv: React.MutableRefObject<Vector2>;
  progress?: number;
  playbackMode?: "interactive" | "auto";
  easing?: string;
}) {
  return (
    <>
      <CameraRig parallaxFactor={cameraParallax} />
      <SceneEnvironment preset={environmentPreset} blur={environmentBlur} />
      {showGrid && (
        <GridPlane
          targetCenterUv={targetCenterUv}
          gridScale={gridScale}
          gridLineWidth={gridLineWidth}
          gridColor={gridColor}
          backgroundColor={backgroundColor}
          transparent={transparentBackground}
          progress={progress}
          playbackMode={playbackMode}
          easing={easing}
        />
      )}
      {!transparentBackground && (
        <color attach="background" args={[backgroundColor]} />
      )}
    </>
  );
}
