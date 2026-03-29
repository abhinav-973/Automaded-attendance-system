import jwt from "jsonwebtoken";

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // ← sets req.user.id for all protected routes
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
};

export default verifyToken;