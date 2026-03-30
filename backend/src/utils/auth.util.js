import { adminEmails } from "../config/env.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const getRoleForEmail = (email, fallbackRole = "teacher") => {
    if (adminEmails.has(normalizeEmail(email))) {
        return "admin";
    }

    return fallbackRole || "teacher";
};

const syncResolvedRole = async (user) => {
    const resolvedRole = getRoleForEmail(user.email, user.role);

    if (user.role !== resolvedRole) {
        user.role = resolvedRole;
        await user.save();
    }

    return resolvedRole;
};

export { getRoleForEmail, normalizeEmail, syncResolvedRole };
