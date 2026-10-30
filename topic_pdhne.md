# ye file study purpose ke liye hai 

USER node (Non-Root Security): Container ko root user par na chala kar node user par chalana CIS Docker Benchmark aur OWASP Top 10 ka standard security practice hai. Agar container me koi RCE vulnerability bhi aayi, toh attacker VPS ka root access nahi le payega.

Security Risk: python3, make, aur g++ sirf argon2 module ko build karne ke liye chahiye hote hain. Lekin production container ke andar g++ aur make ka chhooth jaana security risk hai: agar kisi web dependency me kabhi koi Remote Code Execution (RCE) bug nikla, toh attacker container ke andar hi custom C/C++ rootkits ya exploit binaries compile kar sakta hai.

isme btrate kya hota h or oske kya kya kaam hai ? pixel ke acording bitrate kaise pta chlta hai ?

3-Resolution ABR (Adaptive Bitrate) Slicing:

1080p (Full HD): High bitrate (~3000k)
720p (HD): Medium bitrate (~1500k)
360p (Mobile Data Saver): Low bitrate (~500k)





Alag folders na hone ke 2 bade faayde hote hain:

Relative Pathing (HLS Player compatibility):
master.m3u8 playlist ke andar sub-playlists hoti hain (res_1080p.m3u8, res_720p.m3u8, res_360p.m3u8). Jab sab ek hi folder me hoti hain, toh Video.js ya student ke browser ko subfolder routing ya relative path resolve karne me koi error nahi aati.
DRM Key Delivery:
AES-128 encryption key URI (/api/videos/:id/key) sabhi resolutions ke liye same base directory se clean access hoti hai.

(Note: Agar aapko 1080p/, 720p/ jaise alag sub-folders pasand hain, toh FFmpeg me segment path path.join(hlsOutputDir, "%v", "seg_%03d.ts") karke banaye ja sakte hain, lekin single-folder structure standard aur robust mana jata hai).