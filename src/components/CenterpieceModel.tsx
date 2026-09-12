"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, DoubleSide, Group, Mesh, MeshPhysicalMaterial, type MeshPhysicalMaterialParameters, type Object3D } from "three";
import { useEditorStore } from "../store/editorStore";
import { svgToGeometry, pngToGeometry } from "../lib/logoGeometry";

export function CenterpieceModel({
  fallbackModelUrl,
  materialParams,
  angleRef,
}: {
  fallbackModelUrl: string; // e.g. "/models/helmet.glb" or "/models/rubens.glb"
  materialParams: MeshPhysicalMaterialParameters;
  angleRef: React.MutableRefObject<number>;
}) {
  const centerpieceLogo = useEditorStore((s) => s.centerpieceLogo);
  const fallback = useGLTF(fallbackModelUrl);
  const [logoGeometry, setLogoGeometry] = useState<BufferGeometry | null>(null);

  // Read centerpiece template parameters
  const logoDepth = (useEditorStore((s) => s.templateParams.logoDepth) as number) ?? 8;
  const logoBevelEnabled = (useEditorStore((s) => s.templateParams.logoBevelEnabled) as boolean) ?? true;
  const logoBevelThickness = (useEditorStore((s) => s.templateParams.logoBevelThickness) as number) ?? 1;
  const logoBevelSize = (useEditorStore((s) => s.templateParams.logoBevelSize) as number) ?? 0.5;
  const logoBevelSegments = (useEditorStore((s) => s.templateParams.logoBevelSegments) as number) ?? 2;
  const logoCurveSegments = (useEditorStore((s) => s.templateParams.logoCurveSegments) as number) ?? 12;
  const logoScale = (useEditorStore((s) => s.templateParams.logoScale) as number) ?? 2;

  const logoColor = (useEditorStore((s) => s.templateParams.logoColor) as string) ?? "#ffffff";
  const logoMetalness = (useEditorStore((s) => s.templateParams.logoMetalness) as number) ?? 0.1;
  const logoRoughness = (useEditorStore((s) => s.templateParams.logoRoughness) as number) ?? 0;
  const logoTransmission = (useEditorStore((s) => s.templateParams.logoTransmission) as number) ?? 1;
  const logoThickness = (useEditorStore((s) => s.templateParams.logoThickness) as number) ?? 10;
  const logoIor = (useEditorStore((s) => s.templateParams.logoIor) as number) ?? 1.9;
  const logoClearcoat = (useEditorStore((s) => s.templateParams.logoClearcoat) as number) ?? 0.1;
  const logoClearcoatRoughness = (useEditorStore((s) => s.templateParams.logoClearcoatRoughness) as number) ?? 1.1;

  const logoPositionX = (useEditorStore((s) => s.templateParams.logoPositionX) as number) ?? 0;
  const logoPositionY = (useEditorStore((s) => s.templateParams.logoPositionY) as number) ?? 0;
  const logoPositionZ = (useEditorStore((s) => s.templateParams.logoPositionZ) as number) ?? 0;
  const logoRotationX = (useEditorStore((s) => s.templateParams.logoRotationX) as number) ?? 0;
  const logoRotationY = (useEditorStore((s) => s.templateParams.logoRotationY) as number) ?? 0;
  const logoRotationZ = (useEditorStore((s) => s.templateParams.logoRotationZ) as number) ?? 0;

  const logoFloatEnabled = (useEditorStore((s) => s.templateParams.logoFloatEnabled) as boolean) ?? true;
  const logoFloatSpeed = (useEditorStore((s) => s.templateParams.logoFloatSpeed) as number) ?? 1.5;
  const logoFloatAmplitude = (useEditorStore((s) => s.templateParams.logoFloatAmplitude) as number) ?? 0.08;
  const logoSpinSpeed = (useEditorStore((s) => s.templateParams.logoSpinSpeed) as number) ?? 0;

  // Build physical material on top of standard scene params
  const material = useMemo(() => {
    return new MeshPhysicalMaterial({
      ...materialParams,
      color: logoColor,
      metalness: logoMetalness,
      roughness: logoRoughness,
      transmission: logoTransmission,
      thickness: logoThickness,
      ior: logoIor,
      clearcoat: logoClearcoat,
      clearcoatRoughness: logoClearcoatRoughness,
    });
  }, [
    materialParams,
    logoColor,
    logoMetalness,
    logoRoughness,
    logoTransmission,
    logoThickness,
    logoIor,
    logoClearcoat,
    logoClearcoatRoughness,
  ]);

  const modelRef = useRef<Object3D | null>(null);
  const baseRotation = useMemo(() => ({ x: Math.PI / 8, y: Math.PI / 2 }), []);

  useEffect(() => {
    let cancelled = false;
    logoGeometry?.dispose();

    const build = async () => {
      if (!centerpieceLogo) {
        if (!cancelled) setLogoGeometry(null);
        return;
      }
      if (centerpieceLogo.kind === "model" || centerpieceLogo.kind === "photo") {
        if (!cancelled) setLogoGeometry(null);
        return;
      }
      const geom =
        centerpieceLogo.kind === "svg"
          ? svgToGeometry(centerpieceLogo.raw, {
              depth: logoDepth,
              bevelEnabled: logoBevelEnabled,
              bevelThickness: logoBevelThickness,
              bevelSize: logoBevelSize,
              bevelSegments: logoBevelSegments,
              curveSegments: logoCurveSegments,
              scale: logoScale,
            })
          : await pngToGeometry(centerpieceLogo.raw, {
              depth: logoDepth,
              bevelEnabled: logoBevelEnabled,
              bevelThickness: logoBevelThickness,
              bevelSize: logoBevelSize,
              bevelSegments: logoBevelSegments,
              curveSegments: logoCurveSegments,
              scale: logoScale,
            });
      if (!cancelled) setLogoGeometry(geom);
    };
    build();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    centerpieceLogo,
    logoDepth,
    logoBevelEnabled,
    logoBevelThickness,
    logoBevelSize,
    logoBevelSegments,
    logoCurveSegments,
    logoScale,
  ]);

  useEffect(() => () => material.dispose(), [material]);

  const groupRef = useRef<Group | null>(null);
  const idleSpinAngleRef = useRef(0);

  useFrame((state, delta) => {
    if (logoSpinSpeed !== 0) {
      idleSpinAngleRef.current += delta * logoSpinSpeed;
    }

    const obj = modelRef.current;
    if (obj) {
      obj.rotation.x = baseRotation.x;
      obj.rotation.y = baseRotation.y - angleRef.current + idleSpinAngleRef.current;
    }

    if (groupRef.current) {
      const hover = logoFloatEnabled
        ? Math.sin(state.clock.getElapsedTime() * logoFloatSpeed) * logoFloatAmplitude
        : 0;
      const subtleTilt = logoFloatEnabled
        ? Math.cos(state.clock.getElapsedTime() * (logoFloatSpeed * 0.75)) * (logoFloatAmplitude * 0.35)
        : 0;

      groupRef.current.position.set(logoPositionX, logoPositionY + hover, logoPositionZ);
      groupRef.current.rotation.set(
        (logoRotationX * Math.PI) / 180 + subtleTilt,
        (logoRotationY * Math.PI) / 180,
        (logoRotationZ * Math.PI) / 180 + subtleTilt * 0.5,
      );
    }
  });

  // Fallback: original GLB model, same traverse-and-assign pattern as before
  const scene = useMemo(() => fallback.scene.clone(true), [fallback.scene]);
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const isRubens = fallbackModelUrl.includes("rubens");
    const scale = isRubens ? (isMobile ? 0.042 : 0.05) : (isMobile ? 0.58 : 0.7);
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.scale.set(scale, scale, scale);
        object.material = material;
        object.material.needsUpdate = true;
      }
    });
  }, [scene, material, fallbackModelUrl]);

  const renderContent = () => {
    if (centerpieceLogo?.kind === "model") {
      return (
        <UserModelCenterpiece
          url={centerpieceLogo.url}
          material={material}
          angleRef={angleRef}
          idleSpinAngleRef={idleSpinAngleRef}
          baseRotation={baseRotation}
          keepOriginalMaterial={centerpieceLogo.keepOriginalMaterial}
        />
      );
    }
    if (centerpieceLogo?.kind === "photo") {
      return (
        <PhotoCenterpiece
          url={centerpieceLogo.url}
          angleRef={angleRef}
          idleSpinAngleRef={idleSpinAngleRef}
          baseRotation={baseRotation}
        />
      );
    }

    if (logoGeometry) {
      return (
        <mesh
          ref={(el) => {
            modelRef.current = el;
          }}
          geometry={logoGeometry}
          material={material}
          rotation={[baseRotation.x, baseRotation.y, 0]}
        />
      );
    }

    return (
      <primitive
        ref={(el: Object3D | null) => {
          modelRef.current = el;
        }}
        object={scene}
        rotation={[baseRotation.x, baseRotation.y, 0]}
      />
    );
  };

  return (
    <group
      ref={(el) => {
        groupRef.current = el;
      }}
      position={[logoPositionX, logoPositionY, logoPositionZ]}
      rotation={[
        (logoRotationX * Math.PI) / 180,
        (logoRotationY * Math.PI) / 180,
        (logoRotationZ * Math.PI) / 180,
      ]}
      scale={logoScale / 2}
    >
      {renderContent()}
    </group>
  );
}

function UserModelCenterpiece({
  url,
  material,
  angleRef,
  idleSpinAngleRef,
  baseRotation,
  keepOriginalMaterial,
}: {
  url: string;
  material: MeshPhysicalMaterial;
  angleRef: React.MutableRefObject<number>;
  idleSpinAngleRef: React.MutableRefObject<number>;
  baseRotation: { x: number; y: number };
  keepOriginalMaterial?: boolean;
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const ref = useRef<Object3D | null>(null);

  useEffect(() => {
    cloned.traverse((obj) => {
      if (obj instanceof Mesh) {
        if (!keepOriginalMaterial) {
          obj.material = material; // reuse the scene's existing glass/metal material
          obj.material.needsUpdate = true;
        }
      }
    });
  }, [cloned, material, keepOriginalMaterial]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x = baseRotation.x;
      ref.current.rotation.y = baseRotation.y - angleRef.current + idleSpinAngleRef.current;
    }
  });

  return (
    <primitive
      ref={(el: Object3D | null) => {
        ref.current = el;
      }}
      object={cloned}
      rotation={[baseRotation.x, baseRotation.y, 0]}
    />
  );
}

function PhotoCenterpiece({
  url,
  angleRef,
  idleSpinAngleRef,
  baseRotation,
}: {
  url: string;
  angleRef: React.MutableRefObject<number>;
  idleSpinAngleRef: React.MutableRefObject<number>;
  baseRotation: { x: number; y: number };
}) {
  const texture = useTexture(url);
  const ref = useRef<Mesh | null>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x = baseRotation.x;
      ref.current.rotation.y = baseRotation.y - angleRef.current + idleSpinAngleRef.current;
    }
  });

  return (
    <mesh
      ref={(el) => {
        ref.current = el;
      }}
      rotation={[baseRotation.x, baseRotation.y, 0]}
    >
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        side={DoubleSide}
        transparent
      />
    </mesh>
  );
}
