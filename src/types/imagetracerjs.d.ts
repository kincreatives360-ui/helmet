declare module "imagetracerjs" {
  const ImageTracer: {
    imageToSVG: (
      url: string,
      callback: (svgString: string) => void,
      options?: Record<string, unknown>,
    ) => void;
    [key: string]: unknown;
  };
  export default ImageTracer;
}
