B. Mode A vs Mode B Confusion (Header vs Form Field)
Code Logic: Backend do tareeqe support karta hai:
Mode A (2-Step): Pehle POST /api/admin/lms/videos (JSON) karke videoId lo, phir POST /api/admin/lms/videos/:id/upload par video binary stream karo.
Mode B (Single-Step): Direct POST /api/admin/lms/videos/upload. Lekin isme title, courseId request body (form-data fields) me nahi, balki custom HTTP headers (x-course-id, x-video-title) me hone chahiye.