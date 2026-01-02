import express from "express";
import {
  createMocaSelf,
  getAllMocaSelfs,
  getMocaSelfById,
  updateMocaSelf,
  deleteMocaSelf,
} from "../controllers/mocaSelfController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Crear (POST) o listar todos (GET) con filtro opcional por patientId
router.route("/").post(protect, createMocaSelf).get(protect, getAllMocaSelfs);

// Obtener uno, actualizar, o eliminar por su ID
router
  .route("/:id")
  .get(protect, getMocaSelfById)
  .put(protect, updateMocaSelf)
  .delete(protect, deleteMocaSelf);

export default router;
