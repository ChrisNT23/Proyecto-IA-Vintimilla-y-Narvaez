import asyncHandler from "../middleware/asyncHandler.js";
import Activity from '../models/activityModel.js';

//@desc Fetch all activities
//@route GET/api/activities
//@access Public
const getActivities = asyncHandler(async (req, res) => {
    const activities = await Activity.find({});
    res.json(activities);
});

//@desc Create a new activity
//@route POST/api/activities
//@access Private/admin
const createActivity = asyncHandler(async (req, res) => {
    try {
        const { name, description, type, dateCompletion, scoreObtained, timeUsed, difficultyLevel, observations, progress, image, activeView, patientId } = req.body;

        const activity = new Activity({
            name: name || "Sample activity",
            description: description || "Sample description",
            type: type || "general",
            dateCompletion: dateCompletion || Date.now(),
            scoreObtained: scoreObtained || 0,
            timeUsed: timeUsed || 0,
            difficultyLevel: difficultyLevel || 1,
            observations: observations || "No observations",
            progress: progress || "pending",
            image: image || '/images/sample.jpg',
            activeView: activeView ,
            patientId: req.user._id // Asumiendo que se está enviando este dato en la solicitud
        });

        const createdActivity = await activity.save();
        res.status(201).json(createdActivity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Error creating activity" });
    }
});

//@desc Fetch a single activity by ID
//@route GET/api/activities/:id
//@access Public
const getActivityById = asyncHandler(async (req, res) => {
    const activity = await Activity.findById(req.params.id);

    if (activity) {
        res.json(activity);
    } else {
        res.status(404);
        throw new Error('Activity not found');
    }
});

//@desc Update an activity
//@route PUT/api/activities/:id
//@access Private/Admin
const updateActivity = asyncHandler(async (req, res) => {
    const { name, description, type, dateCompletion, scoreObtained, timeUsed, difficultyLevel, observations, progress,image, activeView, patientId } = req.body;
    const activity = await Activity.findById(req.params.id);

    if (activity) {
        activity.name = name || activity.name;
        activity.description = description || activity.description;
        activity.type = type || activity.type;
        activity.dateCompletion = dateCompletion || activity.dateCompletion;
        activity.scoreObtained = scoreObtained || activity.scoreObtained;
        activity.timeUsed = timeUsed || activity.timeUsed;
        activity.difficultyLevel = difficultyLevel || activity.difficultyLevel;
        activity.observations = observations || activity.observations;
        activity.progress = progress || activity.progress;
        activity.image= image || activity.image;
        activity.activeView=activeView||activity.activeView;

        const updatedActivity = await activity.save();
        res.json(updatedActivity);
    } else {
        res.status(404);
        throw new Error('Activity not found');
    }
});

//@desc Delete an activity
//@route DELETE/api/activities/:id
//@access Private/Admin
const deleteActivity = asyncHandler(async (req, res) => {
    const activity = await Activity.findById(req.params.id);

    if (activity) {
        await Activity.deleteOne({ _id: activity._id });
        res.status(200).json({ message: 'Activity deleted' });
    } else {
        res.status(404);
        throw new Error('Activity not found');
    }
});

//@desc Add a review to an activity (if needed, similar to product reviews)
//@route POST/api/activities/:id/reviews
//@access Private
const createActivityReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const activity = await Activity.findById(req.params.id);

    if (activity) {
        const alreadyReviewed = activity.reviews.find(
            (review) => review.user.toString() === req.user._id.toString()
        );
        if (alreadyReviewed) {
            res.status(400);
            throw new Error('Activity already reviewed');
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        activity.reviews.push(review);
        activity.numReviews = activity.reviews.length;

        activity.rating =
            activity.reviews.reduce((acc, review) => acc + review.rating, 0) / activity.reviews.length;

        await activity.save();
        res.status(201).json({ message: 'Review added' });
    } else {
        res.status(404);
        throw new Error('Activity not found');
    }
});



export {
    getActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    createActivityReview
};
