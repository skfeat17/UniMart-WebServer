import { Router } from "express";
import { verifyJWT } from "../middlewares/verify.js";
import { InboxList, sendMessage } from "../controllers/message.js";



const router = Router();

router.post('/send/:id',verifyJWT,sendMessage)
router.get("/inbox",verifyJWT,InboxList)
export default router







