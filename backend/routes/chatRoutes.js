import express from "express";
import {
  createChat,
  getChats,
  getMessages,
  sendMessage,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createChat).get(protect, getChats);
router.route("/:chatId/messages").get(protect, getMessages);
router.route("/:chatId/send").post(protect, sendMessage);

export default router;
