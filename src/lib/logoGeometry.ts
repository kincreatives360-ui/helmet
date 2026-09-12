import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { ExtrudeGeometry, Shape, BufferGeometry, Box3, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import ImageTracer from "imagetracerjs";

export interface ExtrusionOptions {
  depth?: number;
  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;
  bevelSegments?: number;
  curveSegments?: number;
  scale?: number;
}

export function svgToGeometry(svgMarkup: string, options: ExtrusionOptions = {}): BufferGeometry {
  const {
    depth = 8,
    bevelEnabled = true,
    bevelThickness = 1,
    bevelSize = 0.5,
    bevelSegments = 2,
    curveSegments = 12,
    scale = 2,
  } = options;

  const loader = new SVGLoader();
  const { paths } = loader.parse(svgMarkup);

  const shapes: Shape[] = paths.flatMap((path) => path.toShapes());

  if (shapes.length === 0) {
    return new BufferGeometry();
  }

  const extrudedList = shapes.map(
    (shape) =>
      new ExtrudeGeometry(shape, {
        depth,
        bevelEnabled,
        bevelThickness,
        bevelSize,
        bevelSegments,
        curveSegments,
      }),
  );

  const geometry = mergeGeometries(extrudedList);
  if (!geometry) {
    return new BufferGeometry();
  }

  // Normalize: center at origin, scale to custom scale
  geometry.computeBoundingBox();
  const box = geometry.boundingBox as Box3;
  const size = new Vector3();
  box.getSize(size);
  const center = new Vector3();
  box.getCenter(center);

  geometry.translate(-center.x, -center.y, -center.z);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const finalScale = scale / maxDim;
  geometry.scale(finalScale, -finalScale, finalScale); // flip Y: SVG y-down vs three.js y-up

  return geometry;
}

export function pngToGeometry(pngDataUrl: string, options: ExtrusionOptions = {}): Promise<BufferGeometry> {
  return new Promise((resolve) => {
    ImageTracer.imageToSVG(
      pngDataUrl,
      (svgString: string) => {
        resolve(svgToGeometry(svgString, options));
      },
      // tracing options: higher pathomit = fewer tiny noisy paths from PNG artifacts
      { pathomit: 8, ltres: 1, qtres: 1 },
    );
  });
}
