## 2026-03-15 - Information Leakage in Error Responses
**Vulnerability:** HTTP 500 error responses were leaking internal system details, such as database error messages and stack traces, directly to the client via `http.Error(w, err.Error(), ...)` and `res.Err` in `httpResponseHandler`.
**Learning:** Using `err.Error()` in public-facing responses is a common pattern that inadvertently exposes internal architecture, library versions, and potential injection points to attackers.
**Prevention:** Always use generic error messages for server-side errors (5xx) in public responses. Centralize error handling to ensure consistent masking and internal logging of detailed errors.
