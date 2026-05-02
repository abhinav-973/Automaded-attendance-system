const splitCsv = (value = "") =>
    value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

const parsePositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeSameSite = (value) => {
    const normalized = (value || "").toLowerCase();
    if (["lax", "strict", "none"].includes(normalized)) {
        return normalized;
    }
    return "lax";
};

const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = splitCsv(
    process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000"
);
const adminEmails = new Set(
    splitCsv(process.env.ADMIN_EMAILS).map((email) => email.toLowerCase())
);
const cookieSameSite = normalizeSameSite(process.env.COOKIE_SAMESITE);
const cookieSecure = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : isProduction;
const faceServiceUrl = process.env.FACE_SERVICE_URL || "http://localhost:5001";
const faceServiceTimeoutMs = parsePositiveInteger(
    process.env.FACE_SERVICE_TIMEOUT_MS,
    180000
);

const corsOriginHandler = (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

const buildCookieOptions = () => ({
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000,
});

const buildClearCookieOptions = () => ({
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
});

export {
    adminEmails,
    allowedOrigins,
    buildClearCookieOptions,
    buildCookieOptions,
    cookieSameSite,
    corsOriginHandler,
    faceServiceUrl,
    faceServiceTimeoutMs,
    isProduction,
};
