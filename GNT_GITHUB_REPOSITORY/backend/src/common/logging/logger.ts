export const logger = {
  info(message: string, meta?: unknown) { console.info(message, meta ?? ''); },
  // 2026-09-05: `warn` जोड़ा — अनुमति से रोकी गई request न सामान्य info है, न server की
  // error; वह चेतावनी है और log में अलग दिखनी चाहिए।
  warn(message: string, meta?: unknown) { console.warn(message, meta ?? ''); },
  error(message: string, meta?: unknown) { console.error(message, meta ?? ''); },
};
