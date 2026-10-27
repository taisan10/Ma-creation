# ye file study purpose ke liye hai 

USER node (Non-Root Security): Container ko root user par na chala kar node user par chalana CIS Docker Benchmark aur OWASP Top 10 ka standard security practice hai. Agar container me koi RCE vulnerability bhi aayi, toh attacker VPS ka root access nahi le payega.

Security Risk: python3, make, aur g++ sirf argon2 module ko build karne ke liye chahiye hote hain. Lekin production container ke andar g++ aur make ka chhooth jaana security risk hai: agar kisi web dependency me kabhi koi Remote Code Execution (RCE) bug nikla, toh attacker container ke andar hi custom C/C++ rootkits ya exploit binaries compile kar sakta hai.

isme btrate kya hota h or oske kya kya kaam hai ? pixel ke acording bitrate kaise pta chlta hai ?

3-Resolution ABR (Adaptive Bitrate) Slicing:

1080p (Full HD): High bitrate (~3000k)
720p (HD): Medium bitrate (~1500k)
360p (Mobile Data Saver): Low bitrate (~500k)
