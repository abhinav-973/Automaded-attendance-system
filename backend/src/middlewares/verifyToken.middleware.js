import jwt from "jsonwebtoken";

const verifyToken = async (req, res, next) => {
    try {
        // ✅ Extract accessToken from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded;  // ← sets req.user.id for all protected routes
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
};

export default verifyToken;