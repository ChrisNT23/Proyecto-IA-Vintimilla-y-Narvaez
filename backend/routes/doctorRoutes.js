import express from "express";
const router = express.Router();
import { getDoctors, addPatientToDoctor, getDoctorWithPatients } from "../controllers/doctorController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

router.route("/").get(protect, admin, getDoctors);
router.route("/withPatients").get(protect, admin, getDoctorWithPatients);
router.route('/:doctorId/addPatient').post(protect,admin,addPatientToDoctor);
export default router;
