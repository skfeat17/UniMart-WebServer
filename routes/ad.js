import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { postAd, updateAd } from "../controllers/ad.js";
import { verifyJWT } from "../middlewares/verify.js";
import { verifyAdOwnerShip } from "../middlewares/verifyAdOwnership.js";

const router = Router();

router.post("/post", verifyJWT,upload.array("images", 5), postAd);
router.put("/update/details/:id",verifyAdOwnerShip,updateAd)

export default router;
