# Debug Session: upload-500-error
- **Status**: [OPEN]
- **Issue**: `/api/upload` returns `500 FUNCTION_INVOCATION_FAILED` on Vercel after redeploy.
- **Debug Server**: Pending startup
- **Log File**: `.dbg/trae-debug-log-upload-500-error.ndjson`

## Reproduction Steps
1. Open `budolshap.vercel.app/store/add-product`.
2. Add a product image.
3. Observe `POST /api/upload` fail with `500 FUNCTION_INVOCATION_FAILED`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | `cloudinary.api.create_folder()` crashes in the Vercel runtime | High | Low | Pending |
| B | A module import in the upload route crashes during serverless startup | High | Medium | Pending |
| C | The request body / `File` conversion path crashes before Cloudinary upload | Medium | Medium | Pending |
| D | Cloudinary env/config is valid for upload but invalid for admin-folder creation | Medium | Low | Pending |

## Log Evidence
- Vercel symptom: `POST /api/upload` returns `500 FUNCTION_INVOCATION_FAILED` before any outbound request is shown.
- Local evidence: [middleware.js](file:///d:/IT%20Projects/clone/budolEcosystem/budolshap-0.1.0/middleware.js) applied a global `4MB` request gate to all POST/PUT requests except none, including `/api/upload`.
- Local evidence: [uploadUtils.js](file:///d:/IT%20Projects/clone/budolEcosystem/budolshap-0.1.0/lib/uploadUtils.js) sent image uploads as base64 JSON, inflating payload size compared with multipart `FormData`.
- Local evidence: production build succeeded after changing the helper to use `FormData` for file uploads and exempting `/api/upload` from the middleware size gate.

## Verification Conclusion
- Implemented fix candidate:
  1. Send `FormData` for file uploads in `uploadImage()` / `uploadVideo()`.
  2. Keep JSON fallback only for existing string/base64 callers.
  3. Skip the middleware `4MB` size gate for `/api/upload` because the route already validates upload size.
- Awaiting redeploy and user verification on Vercel.
