import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { postAd, updateAd, updateAdImage } from "../controllers/ad.js";
import { verifyJWT } from "../middlewares/verify.js";
import { verifyAdOwnerShip } from "../middlewares/verifyAdOwnership.js";

const router = Router();

router.post("/post", verifyJWT,upload.array("images", 5), postAd);
router.put("/update/details/:id",verifyAdOwnerShip,updateAd)
router.put("/update/image/:id",verifyAdOwnerShip,upload.array("images", 5),updateAdImage)

export default router;
