import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { ExtrudeGeometry, Shape, BufferGeometry, Box3, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import ImageTracer from "imagetracerjs";

export function svgToGeometry(svgMarkup: string, targetSize = 2): BufferGeometry {
  const loader = new SVGLoader();
  const { paths } = loader.parse(svgMarkup);

  const shapes: Shape[] = paths.flatMap((path) => path.toShapes());

  if (shapes.length === 0) {
    return new BufferGeometry();
  }

  const extrudedList = shapes.map(
    (shape) =>
      new ExtrudeGeometry(shape, {
        depth: 8,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.5,
        bevelSegments: 2,
      }),
  );

  const geometry = mergeGeometries(extrudedList);
  if (!geometry) {
    return new BufferGeometry();
  }

  // Normalize: center at origin, scale to targetSize
  geometry.computeBoundingBox();
  const box = geometry.boundingBox as Box3;
  const size = new Vector3();
  box.getSize(size);
  const center = new Vector3();
  box.getCenter(center);

  geometry.translate(-center.x, -center.y, -center.z);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDim;
  geometry.scale(scale, -scale, scale); // flip Y: SVG y-down vs three.js y-up

  return geometry;
}

export function pngToGeometry(pngDataUrl: string, targetSize = 2): Promise<BufferGeometry> {
  return new Promise((resolve) => {
    ImageTracer.imageToSVG(
      pngDataUrl,
      (svgString: string) => {
        resolve(svgToGeometry(svgString, targetSize));
      },
      // tracing options: higher pathomit = fewer tiny noisy paths from PNG artifacts
      { pathomit: 8, ltres: 1, qtres: 1 },
    );
  });
}
