#include <emscripten.h>
#include <stdlib.h>
#include <cmath>

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void grayscale(unsigned char* data, int length) {
        for (int i = 0; i < length; i += 4) {
            unsigned char r = data[i];
            unsigned char g = data[i + 1];
            unsigned char b = data[i + 2];

            unsigned char gray = (r * 0.3 + g * 0.59 + b * 0.11);
            data[i] = data[i + 1] = data[i + 2] = gray;
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void invert(unsigned char* data, int length) {
        for (int i = 0; i < length; i += 4) {
            data[i] = 255 - data[i];     // Invert Red
            data[i + 1] = 255 - data[i + 1]; // Invert Green
            data[i + 2] = 255 - data[i + 2]; // Invert Blue
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void sepia(unsigned char* data, int length) {
        for (int i = 0; i < length; i += 4) {
            unsigned char r = data[i];
            unsigned char g = data[i + 1];
            unsigned char b = data[i + 2];

            data[i] = (unsigned char) fmin(255, (r * 0.393) + (g * 0.769) + (b * 0.189)); // Sepia Red
            data[i + 1] = (unsigned char) fmin(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // Sepia Green
            data[i + 2] = (unsigned char) fmin(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // Sepia Blue
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void adjust_brightness(unsigned char* data, int length, int value) {
        for (int i = 0; i < length; i += 4) {
            data[i] = fmin(255, fmax(0, data[i] + value));     // Adjust Red
            data[i + 1] = fmin(255, fmax(0, data[i + 1] + value)); // Adjust Green
            data[i + 2] = fmin(255, fmax(0, data[i + 2] + value)); // Adjust Blue
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void adjust_contrast(unsigned char* data, int length, float factor) {
        for (int i = 0; i < length; i += 4) {
            data[i] = fmin(255, fmax(0, ((data[i] - 128) * factor) + 128));
            data[i + 1] = fmin(255, fmax(0, ((data[i + 1] - 128) * factor) + 128));
            data[i + 2] = fmin(255, fmax(0, ((data[i + 2] - 128) * factor) + 128));
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void* _malloc(size_t size) {
        return malloc(size);
    }

    EMSCRIPTEN_KEEPALIVE
    void _free(void* ptr) {
        free(ptr);
    }
}