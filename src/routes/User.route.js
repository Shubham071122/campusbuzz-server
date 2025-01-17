import { Router } from "express";
import { fetchProfile, login, logout, register, updateProfile } from "../controllers/User.controller.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { createAvailability, getAvailabilityForNext4Days } from "../controllers/Availability.controller.js";

const router = Router();

router.route("/signup").post(register)
router.route("/login").post(login)

router.route("/logout").post(verifyJWT,logout);
router.route("/update-profile").post(verifyJWT,updateProfile);
router.route("/profile/:userId").get(verifyJWT,fetchProfile);
router.route("/mentor/c/availability").post(verifyJWT,createAvailability);
router.route("/mentor-ava/:userId").get(getAvailabilityForNext4Days);
router.get('/check-auth', verifyJWT, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated!' });
    }

    res.status(200).json({
        success: true,
        user: req.user,
    });
});

export default router;