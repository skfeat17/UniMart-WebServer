import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { postAd } from "../controllers/ad.js";
import { verifyJWT } from "../middlewares/verify.js";

const router = Router();

router.post("/post", verifyJWT,upload.array("images", 5), postAd);

export default router;
