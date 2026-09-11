"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Mesh, MeshPhysicalMaterial, type MeshPhysicalMaterialParameters, type Object3D } from "three";
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

  const material = useMemo(() => new MeshPhysicalMaterial(materialParams), [materialParams]);
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
      const geom =
        centerpieceLogo.kind === "svg"
          ? svgToGeometry(centerpieceLogo.raw)
          : await pngToGeometry(centerpieceLogo.raw);
      if (!cancelled) setLogoGeometry(geom);
    };
    build();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerpieceLogo]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const obj = modelRef.current;
    if (!obj) return;
    obj.rotation.x = baseRotation.x;
    obj.rotation.y = baseRotation.y - angleRef.current;
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
}
