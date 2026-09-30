import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { TemplateData } from '../components/templates/types';
import {
  preloadTemplateAssets,
  renderTemplateFrame,
  type TemplateType,
  type PreloadedAssets,
} from './canvasRenderer';

export interface VideoExportOptions {
  template: TemplateType;
  data: TemplateData;
  theme: 'dark' | 'light';
  durationSeconds?: number;
  fps?: number;
  width?: number;
  height?: number;
  onProgress?: (progress: number, statusText: string) => void;
}

export interface VideoExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

// Find a supported WebCodecs encoder configuration
async function getSupportedEncoderConfig(width: number, height: number, bitrate: number) {
  if (typeof window === 'undefined' || typeof (window as any).VideoEncoder === 'undefined') {
    return null;
  }

  const candidateCodecs = [
    { codec: 'avc1.42001f', muxerCodec: 'avc' as const }, // H.264 Baseline Profile 3.1
    { codec: 'avc1.4d002a', muxerCodec: 'avc' as const }, // H.264 Main Profile 4.2
    { codec: 'avc1.64002a', muxerCodec: 'avc' as const }, // H.264 High Profile 4.2
    { codec: 'vp09.00.10.08', muxerCodec: 'vp9' as const }, // VP9 (widely supported on Linux)
    { codec: 'av01.0.08M.10', muxerCodec: 'av1' as const }, // AV1
  ];

  for (const item of candidateCodecs) {
    try {
      const testConfig = {
        codec: item.codec,
        width,
        height,
        bitrate,
      };
      const res = await (window as any).VideoEncoder.isConfigSupported(testConfig);
      if (res && res.supported) {
        return {
          config: res.config || testConfig,
          muxerCodec: item.muxerCodec,
        };
      }
    } catch {
      // Continue to test next candidate
    }
  }

  return null;
}

export function getDefaultDurationForTemplate(template: TemplateType): number {
  switch (template) {
    case 'infinity':
      return 8.0;
    case 'orbit':
      return 8.0;
    case 'constellation':
      return 8.0;
    case 'hyperdrive':
      return 8.0;
    case 'revolve':
      return 8.0;
    case 'spotlight':
      return 8.0;
    case 'blackhole':
      return 16.0;
    case 'milestone':
      return 8.0;
    default:
      return 8.0;
  }
}

export async function exportTemplateToVideo(
  options: VideoExportOptions
): Promise<VideoExportResult> {
  const {
    template,
    data,
    theme,
    durationSeconds = getDefaultDurationForTemplate(options.template),
    fps = 30,
    width = 1600,
    height = 900,
    onProgress = () => {},
  } = options;

  onProgress(0.05, 'Preloading assets...');
  const assets: PreloadedAssets = await preloadTemplateAssets(template, data, theme);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create 2D canvas context for video export.');
  }

  const baseFilename = `${data.repo || 'stargazer'}-${template}-${theme}`;

  // -------------------------------------------------------------
  // Strategy 1: WebCodecs + mp4-muxer (hardware/software fast encoding)
  // -------------------------------------------------------------
  const encoderSupport = await getSupportedEncoderConfig(width, height, 6_000_000);
  if (encoderSupport) {
    try {
      onProgress(0.1, 'Configuring MP4 encoder...');
      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
          codec: encoderSupport.muxerCodec,
          width,
          height,
        },
        fastStart: 'in-memory',
      });

      let encoderError: any = null;
      const VideoEncoderClass = (window as any).VideoEncoder;
      const VideoFrameClass = (window as any).VideoFrame;

      const videoEncoder = new VideoEncoderClass({
        output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
        error: (e: any) => {
          encoderError = e;
          console.error('VideoEncoder error:', e);
        },
      });

      videoEncoder.configure(encoderSupport.config);

      const totalFrames = Math.round(durationSeconds * fps);
      for (let i = 0; i < totalFrames; i++) {
        if (encoderError) throw encoderError;

        const progress = i / (totalFrames - 1);
        renderTemplateFrame(ctx, template, data, theme, progress, assets);

        const timestampMicros = Math.round(i * (1_000_000 / fps));
        const frame = new VideoFrameClass(canvas, {
          timestamp: timestampMicros,
          duration: Math.round(1_000_000 / fps),
        });

        videoEncoder.encode(frame, { keyFrame: i % fps === 0 });
        frame.close();

        if (i % 6 === 0 || i === totalFrames - 1) {
          onProgress(
            0.15 + (i / totalFrames) * 0.8,
            `Encoding frame ${i + 1} of ${totalFrames}...`
          );
          // Yield to main thread so UI updates smoothly
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      onProgress(0.97, 'Finalizing MP4 container...');
      await videoEncoder.flush();
      muxer.finalize();

      const { buffer } = muxer.target as ArrayBufferTarget;
      const blob = new Blob([buffer], { type: 'video/mp4' });

      onProgress(1.0, 'Done!');
      return {
        blob,
        filename: `${baseFilename}.mp4`,
        mimeType: 'video/mp4',
      };
    } catch (err) {
      console.warn('WebCodecs encoding error, falling back to MediaRecorder:', err);
    }
  }

  // -------------------------------------------------------------
  // Strategy 2: MediaRecorder with active canvas stream drawing
  // -------------------------------------------------------------
  onProgress(0.1, 'Starting real-time canvas stream recording...');

  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
  if (!stream) {
    throw new Error('Your browser does not support canvas video capture.');
  }

  let mimeType = 'video/mp4';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      mimeType = 'video/mp4;codecs=avc1';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }
  }

  return new Promise<VideoExportResult>((resolve, reject) => {
    const recordedChunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 6_000_000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      onProgress(1.0, 'Done!');
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(recordedChunks, { type: mimeType });
      resolve({
        blob,
        filename: `${baseFilename}.${ext}`,
        mimeType,
      });
    };

    recorder.onerror = (e) => reject(e);

    // Initial first frame draw
    renderTemplateFrame(ctx, template, data, theme, 0, assets);

    recorder.start(100);

    const startTime = performance.now();
    const durationMs = durationSeconds * 1000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Actively draw frame to canvas so captureStream generates frames
      renderTemplateFrame(ctx, template, data, theme, progress, assets);

      onProgress(
        0.1 + progress * 0.85,
        `Recording video (${Math.round(progress * 100)}%)...`
      );

      if (elapsed < durationMs) {
        requestAnimationFrame(tick);
      } else {
        recorder.stop();
      }
    };

    requestAnimationFrame(tick);
  });
}

export interface ImageExportOptions {
  template: TemplateType;
  data: TemplateData;
  theme: 'dark' | 'light';
  width?: number;
  height?: number;
}

export async function exportTemplateToImage(
  options: ImageExportOptions
): Promise<string> {
  const {
    template,
    data,
    theme,
    width = 1600,
    height = 900,
  } = options;

  const assets: PreloadedAssets = await preloadTemplateAssets(template, data, theme);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create 2D canvas context for image export.');
  }

  // Render the final completed frame (progress = 1.0)
  renderTemplateFrame(ctx, template, data, theme, 1.0, assets);

  return canvas.toDataURL('image/png');
}

