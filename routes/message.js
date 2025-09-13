import { Router } from "express";
import { verifyJWT } from "../middlewares/verify.js";
import { getChatMessages, InboxList, markMessagesRead, sendMessage } from "../controllers/message.js";



const router = Router();

router.post('/send/:id',verifyJWT,sendMessage)
router.get("/inbox",verifyJWT,InboxList)
router.get("/chat/:id",verifyJWT,getChatMessages)
router.put("/seen/:id",verifyJWT,markMessagesRead)

export default router







