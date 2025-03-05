import { WASI } from "@wasmer/wasi";

export default async function loadWasmModule() {
  try {
    const response = await fetch("/image.wasm"); // Ensure image.wasm is in /public
    const buffer = await response.arrayBuffer();

    // Create a WASI instance
    const wasi = new WASI({
      args: [],
      env: {},
    });

    // Instantiate the WebAssembly module with WASI support
    const wasmModule = await WebAssembly.instantiate(buffer, {
      wasi_snapshot_preview1: wasi.wasiImport, // Provide required WASI imports
    });

    // Start the WASI instance (if required)
    wasi.start(wasmModule.instance);

    return wasmModule.instance.exports;
  } catch (error) {
    console.error("Failed to load WASM module:", error);
    throw error;
  }
}
