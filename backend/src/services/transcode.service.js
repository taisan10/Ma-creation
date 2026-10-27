import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import Video from "../models/Video.js";
import { minioClient, VIDEO_BUCKET } from "../config/minio.js";


export class TranscodeService{

 
    // 1. Probe Video Metadata (Duration, Codec, Width, Height) via local ffprobe
    static  probeMetadata(rawFilePath){
        return new Promise((resolve, reject)=>{
            const ffprobe = spawn("ffprobe",[
                "-v",
                "error",
                "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,codec_name:format=duration",
        "-of",
        "json",
        rawFilePath,
            ]);
let stdout = "";
let stderr = "";

ffprobe.stdout.on("data", (chunk)=> (stdout += chunk.toString()));
ffprobe.stderr.on("data", (chunk)=> (stderr += chunk.toString()));

ffprobe.on("close", (code)=>{
    if(code !== 0){
        return reject(new Error(`ffprobe failed (${code}): ${stderr}`));
        }
        try {
            const data = JSON.parse(stdout);
          const duration = Math.ceil(Number(data.format?.duration || 0));
          const stream = data.streams?.[0] || {};
           resolve({
            durationSeconds: duration,
            width: stream.width || 1920,
            height: stream.height || 1080,
            codec: stream.codec_name || "h264",
          });
        } 
 catch (err) {
          reject(new Error(`Failed to parse ffprobe output: ${err.message}`));
        
        }

});
 ffprobe.on("error", (err) => reject(new Error(`ffprobe spawn error: ${err.message}`)));
  
        })
    }

    // 2. Generate Random 16-byte AES-128 DRM Key & write enc.keyinfo
    static async setupDrmKey(videoId, uploadDir) {
    const encryptionKey = crypto.randomBytes(16);
    const encryptionIv = crypto.randomBytes(16);

    const keyHex = encryptionKey.toString("hex");
    const ivHex = encryptionIv.toString("hex");

    // Save in DB (Protected by select: false in schema)
    await Video.findByIdAndUpdate(videoId, {
      encryptionKeyHex: keyHex,
      encryptionIvHex: ivHex,
    });

    const keyPath = path.join(uploadDir, "enc.key");
    const keyInfoPath = path.join(uploadDir, "enc.keyinfo");

     // Write key with strict 0o600 file permissions (Owner read/write only)
    fs.writeFileSync(keyPath, encryptionKey, { mode: 0o600 });

    // Player key delivery URL placed inside .m3u8 playlists:
    const keyUri = `/api/videos/${videoId}/key`;
    fs.writeFileSync(keyInfoPath, `${keyUri}\n${keyPath}\n${ivHex}\n`, { mode: 0o600 });
    return { keyInfoPath, keyHex, ivHex };
  }

//   3. Run 3-Resolution ABR FFmpeg Pipeline (1080p, 720p, 360p)

 static runFfmpegAbr({ rawFilePath, hlsOutputDir, keyInfoPath, totalDurationSeconds, onProgress }) {
    return new Promise((resolve, reject) => {

      const isLinux = process.platform === "linux";
      const binary = isLinux ? "nice" : "ffmpeg";
      const baseArgs = isLinux ? ["-n", "19", "ffmpeg"] : [];

       const ffmpegArgs = [
         ...baseArgs,
        "-y",
        "-threads",
        "1", // 🔒 Strict 1 vCPU lock for Hostinger KVM-2 stability
        "-protocol_whitelist",
        "file,crypto,data",
        "-i",
         rawFilePath,
        "-filter_complex",
        "[0:v]split=2[v1][v2];" +
          "[v1]scale=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2[v2out];" +
          "[v2]scale=w=640:h=360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2[v3out]",
        // 🔒 1080p Master Passthrough (Stream 0):
        // Admin hamesha 1080p master video upload karega. 1 vCPU VPS (Hostinger KVM-2) par 1080p ko dubara
        // re-encode karne se CPU 100% spike ho jata hai aur transcode time 3x badh jata hai.
        // Isliye 1080p ko direct stream copy (-c:v:0 copy) rakha hai taaki original 1080p quality 100% lossless
        // rahe aur server par CPU load sirf 720p aur 360p generate karne me lage.
        "-map",
        "0:v:0",
        "-c:v:0",
        "copy",
         // 720p stream
        "-map",
        "[v2out]",
        "-c:v:1",
        "libx264",
        "-b:v:1",
        "1500k",
        "-maxrate:v:1",
        "1600k",
        "-bufsize:v:1",
        "3000k",
        "-preset",
        "veryfast",
        "-g",
        "60",
        "-sc_threshold",
        "0",
         // 360p stream
        "-map",
        "[v3out]",
        "-c:v:2",
        "libx264",
        "-b:v:2",
        "500k",
        "-maxrate:v:2",
        "550k",
        "-bufsize:v:2",
        "1000k",
        "-preset",
        "veryfast",
        "-g",
        "60",
        "-sc_threshold",
        "0",
        // Audio streams
        "-map",
        "0:a?",
        "-c:a:0",
        "aac",
        "-b:a:0",
        "128k",
        "-map",
        "0:a?",
        "-c:a:1",
        "aac",
        "-b:a:1",
        "128k",
        "-map",
        "0:a?",
        "-c:a:2",
        "aac",
        "-b:a:2",
        "96k",
        // HLS DRM Packaging
        "-f",
        "hls",
        "-hls_time",
        "6",
        "-hls_playlist_type",
        "vod",
        "-hls_flags",
        "independent_segments",
        "-hls_key_info_file",
        keyInfoPath,
        "-hls_segment_filename",
        path.join(hlsOutputDir, "res_%v_seg_%03d.ts"),
        "-master_pl_name",
         "master.m3u8",
        "-var_stream_map",
        "v:0,a:0,name:1080p v:1,a:1,name:720p v:2,a:2,name:360p",
        path.join(hlsOutputDir, "res_%v.m3u8"),  
       ]

       const proc = spawn(binary, ffmpegArgs);
      let stderrBuffer = "";

      proc.stderr.on("data", (data) => {
        const text = data.toString();
           // 🛡️ Prevent memory leak by keeping only the last 2000 characters
        stderrBuffer = (stderrBuffer + text).slice(-2000);

        const timeMatch = text.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (timeMatch && totalDurationSeconds > 0) {
          const parts = timeMatch[1].split(":");
          const currentSec = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
          const progress = Math.min(90, Math.max(5, Math.round((currentSec / totalDurationSeconds) * 85) + 5));
          onProgress(progress);
        }
      });


  proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with error code ${code}: ${stderrBuffer}`));
      });
      proc.on("error", (err) => reject(new Error(`FFmpeg spawn error: ${err.message}`)));
        
    })
}
  /**
   * 4. Upload HLS Multi-Bitrate Chunks & Manifests to MinIO S3
   * 🛡️ Security Filter: STRICTLY upload only .m3u8 and .ts files!
   * Never leak enc.key or enc.keyinfo to S3/MinIO.
   */
  static async uploadHlsToMinio({ videoId, courseId, hlsOutputDir }) {
    console.log(`[MinIO Upload] Uploading HLS playlist & chunks for video ${videoId}...`);

    const files = fs.readdirSync(hlsOutputDir);
    const remoteHlsDirectory = `courses/${courseId}/${videoId}/hls`;

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();

      // 🛡️ CRITICAL SECURITY CHECK: Only allow HLS segments and playlists!
      if (ext !== ".m3u8" && ext !== ".ts") {
        console.warn(`[MinIO Security] Skipping non-HLS file: ${file}`);
        continue;
      }

      const localFilePath = path.join(hlsOutputDir, file);
      const remoteObjectKey = `${remoteHlsDirectory}/${file}`;

      const contentType = ext === ".m3u8" ? "application/vnd.apple.mpegurl" : "video/mp2t";
      const metaData = {
        "Content-Type": contentType,
        "Cache-Control": ext === ".ts" ? "public, max-age=31536000, immutable" : "no-cache",
      };

      // Direct NVMe-to-MinIO streaming upload
      await minioClient.fPutObject(VIDEO_BUCKET, remoteObjectKey, localFilePath, metaData);
    }

    const hlsManifestKey = `${remoteHlsDirectory}/master.m3u8`;
    console.log(`[MinIO Upload] Successfully uploaded HLS assets to ${remoteHlsDirectory}`);

    return {
      hlsDirectory: remoteHlsDirectory,
      hlsManifestKey,
    };
  }



}