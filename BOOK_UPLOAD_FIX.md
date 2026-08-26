# GeM Book Upload Fix

## What changed

- Admin book upload now uses `multipart/form-data` via `FormData` instead of putting title, description, and filename into custom HTTP headers.
- This fixes browser `fetch()` failures caused by Unicode characters such as `—`, `₹`, Hindi text, and other non-ISO-8859-1 characters in HTTP headers.
- Backend uses a dependency-free multipart parser for the book endpoint and enforces a 50 MB file limit.
- Uploaded files are validated as real PDFs (`%PDF-` signature + `application/pdf`) before being written to MongoDB GridFS.
- Existing MongoDB/GridFS architecture is retained, so local MongoDB and later MongoDB Atlas use the same storage model.
- PDF response headers now include UTF-8 filename metadata for safer downloads.

## Admin upload payload

`title`, `description`, `filename`, `coverImageUrl`, `active`, and `file` are submitted as multipart form fields.

## Important

The current zero-dependency parser buffers the maximum 50 MB upload in memory before writing it to GridFS. This is intentionally compatible with the existing project without adding a new npm dependency. For very high-volume uploads, replace it with a streaming multipart parser such as Busboy/Multer in the deployment environment.
