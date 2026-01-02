import express from 'express';
const router=express.Router();
import { getActivities,getActivityById, createActivity,updateActivity,deleteActivity} from '../controllers/activityController.js';
import {protect,admin} from '../middleware/authMiddleware.js';

router.route('/').get(getActivities).post(protect,createActivity);;
router.route('/:id').get(getActivityById).put(protect,admin,updateActivity).delete(protect,admin,deleteActivity);;

export default router;