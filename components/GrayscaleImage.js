"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export default function ImageFilters() {
  const [wasmModule, setWasmModule] = useState(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [imageSrc, setImageSrc] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        const wasmResponse = await fetch("/image.wasm");
        const wasmBinary = await wasmResponse.arrayBuffer();
        const module = await WebAssembly.instantiate(wasmBinary, {
          env: {
            memory: new WebAssembly.Memory({ initial: 256, maximum: 256 }),
          },
        });

        setWasmModule(module.instance.exports);
      } catch (error) {
        console.error("Failed to load WebAssembly module:", error);
      }
    };

    loadWasm();
  }, []);

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const validTypes = ["image/png", "image/jpeg"];
    if (!validTypes.includes(file.type)) {
      setError("Only PNG and JPG files are allowed.");
      return;
    }
  
    const reader = new FileReader();
    reader.onload = (e) => setImageSrc(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const openCamera = useCallback(async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, []);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    setImageSrc(canvas.toDataURL("image/png"));
    setIsCameraOpen(false);

    // Stop camera stream after capture
    videoRef.current.srcObject?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!wasmModule || !imageSrc) return;

    const applyFilter = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = imageSrc;
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (brightness === 0 && contrast === 0 && grayscale === 0) return;

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;

        // Allocate memory in WebAssembly
        const ptr = wasmModule._malloc(pixels.length);
        const wasmMemory = new Uint8Array(
          wasmModule.memory.buffer,
          ptr,
          pixels.length
        );

        // Copy image data to WebAssembly memory
        wasmMemory.set(pixels);

        // Apply filters based on slider values
        if (grayscale > 0) wasmModule.grayscale(ptr, pixels.length);
        if (brightness !== 0)
          wasmModule.adjust_brightness(ptr, pixels.length, brightness);
        if (contrast !== 0)
          wasmModule.adjust_contrast(ptr, pixels.length, 1 + contrast / 100);

        // Copy modified data back
        pixels.set(wasmMemory);
        ctx.putImageData(imageData, 0, 0);

        // Free WebAssembly memory
        wasmModule._free(ptr);
      };
    };

    applyFilter();
  }, [brightness, contrast, grayscale, imageSrc, wasmModule]);
  
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="p-2 border rounded"
        />
        <button
          onClick={openCamera}
          className="p-2 border rounded bg-blue-500 text-white"
        >
          Open Camera
        </button>
      </div>
      {error ? <p className=" w-full text-red-300">{error}</p> : null}

      {isCameraOpen && (
        <div className="flex flex-col items-center gap-4">
          <video
            ref={videoRef}
            autoPlay
            className="border rounded max-w-full"
          ></video>
          <button
            onClick={handleCapture}
            className="p-2 border rounded bg-green-500 text-white"
          >
            Capture
          </button>
        </div>
      )}

      <div className="flex w-full items-center gap-28">
        {imageSrc && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-semibold">Original Image</p>
            <img
              src={imageSrc}
              alt="Original"
              className="border max-w-[300px] min-w-[250px]"
            />
            <div className="w-full">
              <div>
                <label className="block">Brightness: {brightness}</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block">Contrast: {contrast}</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block">Grayscale: {grayscale}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grayscale}
                  onChange={(e) => setGrayscale(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {imageSrc && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-semibold">Filtered Image</p>
            <canvas ref={canvasRef} className="border max-w-[600px] min-w-[500px]"></canvas>
          </div>
        )}
      </div>
    </div>
  );
}
