import { Router } from "express";
import { 
    registerUser,logInUser,uploadAvatar,updateProfile,logOutUser,
    refreshAccessToken,
    changeUserPassword,
    sendOTP,
    resetPassword,
    getuserProfile,
    updateLastSeen
} from "../controllers/user.js";
import { verifyJWT } from "../middlewares/verify.js";
import { upload } from "../middlewares/multer.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(logInUser)
router.put("/avatar",verifyJWT, upload.single("avatar"), uploadAvatar);
router.put("/update",verifyJWT,updateProfile)
router.post("/logout",verifyJWT,logOutUser)
router.post("/refreshaccesstoken",refreshAccessToken)
router.post("/changepassword",verifyJWT,changeUserPassword)
router.post("/sendotp",sendOTP)
router.post("/reset",resetPassword)
router.get("/profile",verifyJWT,getuserProfile)
router.put("/active",verifyJWT,updateLastSeen)
export default router