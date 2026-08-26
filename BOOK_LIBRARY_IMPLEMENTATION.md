# GeM Book Library Implementation

## What was added
- Services page hero now contains a lightweight CSS 3D book using `frontend/public/assets/gem-book-cover.png`.
- Public API reads the latest active book from MongoDB.
- `Download Now` downloads the stored PDF.
- `Read Online` opens the same PDF with inline browser rendering.
- Admin Console has a **GeM Books** section for PDF upload, publish/hide, read, download and delete.
- PDF files are stored in MongoDB GridFS under the `books` bucket; book metadata is stored in the `books` collection.
- Maximum upload size: 50 MB.
- No third-party file-storage dependency is required.

## Local development
Set `MONGODB_URI` to your local MongoDB database and run the backend. Upload a PDF from `/admin/books`.

## Production / MongoDB Atlas
Replace `MONGODB_URI` with your MongoDB Atlas connection string. The application continues using the same GridFS storage layer; no frontend code change is required.

## API
- `GET /api/public/books` — latest active book metadata
- `GET /api/public/books/:id/read` — inline PDF stream
- `GET /api/public/books/:id/download` — attachment download stream
- `GET /api/admin/books` — admin list
- `POST /api/admin/books/upload` — admin PDF upload
- `PATCH /api/admin/books/:id` — metadata/publish state
- `DELETE /api/admin/books/:id` — delete metadata + GridFS file
