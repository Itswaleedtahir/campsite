const Review = require("../models/reviews")
const User = require("../models/userModel")
const Campsite = require("../models/campsites")
const Reply = require("../models/reviewReply")
const mongoose = require('mongoose');


let methods = {
// controllers/reviewController.js

addReview: async (req, res) => {
    try {
        let _id = req.token._id;
        let user = await User.findOne({ _id });
        if (!user) {
            return res.status(404).json({
                msg: "User not found with this id",
                success: false,
            });
        }

        // Create a new review with status 'pending'
        const newReview = new Review({
            text: req.body.text,
            rating: req.body.rating,
            userId: user._id,
            campsiteId: req.body.campsiteid,
            images: req.body.imageUrl,
            videos: req.body.videoUrl,
            status: 'pending' // Set status to 'pending'
        });

        const savedReview = await newReview.save();

        res.status(201).send(savedReview);
    } catch (error) {
        console.log("error", error);
        return res.status(500).send({ message: 'Error creating the review', error: error.message });
    }
},
// controllers/reviewController.js

approveReview: async (req, res) => {
    try {
        const reviewId = req.params.id;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).send({ message: 'Review not found' });
        }

        // Check if already approved or rejected
        if (review.status === 'approved') {
            return res.status(400).send({ message: 'Review is already approved' });
        }
        if (review.status === 'rejected') {
            return res.status(400).send({ message: 'Review has been rejected' });
        }

        // Update review status to 'approved'
        review.status = 'approved';
        await review.save();

        // Update user reward points and level
        const user = await User.findById(review.userId);

        // Calculate reward points based on review content
        let rewardPoints = 1; // Base point for adding a review with text
        if (review.images && review.images.length > 0) rewardPoints += 2; // Additional points for image
        if (review.videos && review.videos.length > 0) rewardPoints += 4; // Additional points for video

        // Update the user's reward points
        user.rewardPoints += rewardPoints;

        // Update the user's level based on the new reward points
        await user.updateUserLevel();
        await user.save();

        // Update the campsite review stats
        const campsite = await Campsite.findById(review.campsiteId);
        if (!campsite) {
            return res.status(404).send({ message: 'Campsite not found' });
        }

        const totalReviews = campsite.reviewStats.totalReviews + 1;
        const newAverageRating = ((campsite.reviewStats.averageRating * (totalReviews - 1)) + review.rating) / totalReviews;

        campsite.reviewStats.averageRating = newAverageRating;
        campsite.reviewStats.totalReviews = totalReviews;

        await campsite.save();

        res.status(200).send({ message: 'Review approved successfully' });
    } catch (error) {
        console.log("error", error);
        return res.status(500).send({ message: 'Error approving the review', error: error.message });
    }
},

rejectReview: async (req, res) => {
    try {
        const reviewId = req.params.id;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).send({ message: 'Review not found' });
        }

        // Check if already approved or rejected
        if (review.status === 'approved') {
            return res.status(400).send({ message: 'Review is already approved' });
        }
        if (review.status === 'rejected') {
            return res.status(400).send({ message: 'Review has been rejected' });
        }

        // Update review status to 'rejected'
        review.status = 'rejected';
        await review.save();

        res.status(200).send({ message: 'Review rejected successfully' });
    } catch (error) {
        console.log("error", error);
        return res.status(500).send({ message: 'Error rejecting the review', error: error.message });
    }
},
getPendingReviews: async (req, res) => {
    try {
        // Fetch all reviews where status is 'pending'
        const pendingReviews = await Review.find({ status: 'pending' })
            .populate('userId', 'username email') // Adjust fields as needed
            .populate('campsiteId', 'name location'); // Adjust fields as needed

        res.status(200).send({ reviews: pendingReviews });
    } catch (error) {
        console.log("error", error);
        res.status(500).send({ message: 'Error retrieving pending reviews', error: error.message });
    }
},
getApprovedReviews: async (req, res) => {
    try {
        // Optionally, implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch all reviews where status is 'approved'
        const approvedReviews = await Review.find({ status: 'approved' })
            .populate('userId', 'username')
            .populate('campsiteId', 'name location')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by newest first

        // Get total count for pagination
        const totalApprovedReviews = await Review.countDocuments({ status: 'approved' });

        res.status(200).send({
            reviews: approvedReviews,
            total: totalApprovedReviews,
            page: page,
            pages: Math.ceil(totalApprovedReviews / limit),
        });
    } catch (error) {
        console.error("Error in getApprovedReviews:", error);
        res.status(500).send({ message: 'Error retrieving approved reviews', error: error.message });
    }
},
deleteReview: async (req, res) => {
    try {
        const reviewId = req.params.id;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).send({ message: 'Review not found' });
        }

        // Remove the review
        await review.deleteOne(); // Updated line

        // If the review was approved, update the user's reward points and campsite stats
        if (review.status === 'approved') {
            // Update user reward points
            const user = await User.findById(review.userId);
            if (user) {
                // Calculate reward points based on review content
                let rewardPoints = 1; // Base point for adding a review with text
                if (review.images && review.images.length > 0) rewardPoints += 2; // Additional points for image
                if (review.videos && review.videos.length > 0) rewardPoints += 4; // Additional points for video

                // Deduct the reward points
                user.rewardPoints = Math.max(0, user.rewardPoints - rewardPoints);

                // Update the user's level based on the new reward points
                await user.updateUserLevel();
                await user.save();
            }

            // Update campsite review stats
            const campsite = await Campsite.findById(review.campsiteId);
            if (campsite) {
                const totalReviews = Math.max(0, campsite.reviewStats.totalReviews - 1);
                const totalRatingValue = (campsite.reviewStats.averageRating * (campsite.reviewStats.totalReviews + 1)) - review.rating;
                const newAverageRating = totalReviews > 0 ? totalRatingValue / totalReviews : 0;

                campsite.reviewStats.averageRating = newAverageRating;
                campsite.reviewStats.totalReviews = totalReviews;

                await campsite.save();
            }
        }

        res.status(200).send({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error("Error in deleteReview:", error);
        res.status(500).send({ message: 'Error deleting the review', error: error.message });
    }
},
getReviewsForSingleCampsites: async (req, res) => {
    try {
        const campsiteId = req.params.campsiteId;
        console.log("id", campsiteId);

        // Aggregate to get ratings summary for approved reviews only
        const reviewsData = await Review.aggregate([
            {
                $match: {
                    campsiteId: new mongoose.Types.ObjectId(campsiteId),
                    status: 'approved' // Only include approved reviews
                }
            },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Initialize ratings summary with zeros for all possible ratings from 1 to 5
        const ratingsSummary = {
            one: 0,
            two: 0,
            three: 0,
            four: 0,
            five: 0
        };

        // Populate ratings summary with actual counts from reviewsData
        reviewsData.forEach(item => {
            switch (item._id) {
                case 1:
                    ratingsSummary.one = item.count;
                    break;
                case 2:
                    ratingsSummary.two = item.count;
                    break;
                case 3:
                    ratingsSummary.three = item.count;
                    break;
                case 4:
                    ratingsSummary.four = item.count;
                    break;
                case 5:
                    ratingsSummary.five = item.count;
                    break;
            }
        });

        // Calculate total reviews and total rating value
        const totalReviews = Object.values(ratingsSummary).reduce((acc, count) => acc + count, 0);
        const totalRatingValue = Object.entries(ratingsSummary).reduce((acc, [key, count]) => {
            const rating = {
                one: 1,
                two: 2,
                three: 3,
                four: 4,
                five: 5
            }[key];
            return acc + (rating * count);
        }, 0);

        // Compute the average rating
        const averageRating = totalReviews > 0 ? (totalRatingValue / totalReviews).toFixed(2) : 0;

        // Find approved reviews and populate user details
        const reviews = await Review.find({
            campsiteId: new mongoose.Types.ObjectId(campsiteId),
            status: 'approved' // Only include approved reviews
        })
            .populate('userId')
            .lean(); // Use lean to improve performance as it returns plain JavaScript objects

        // Asynchronously populate replies for each review
        const reviewsWithReplies = await Promise.all(reviews.map(async review => {
            const replies = await Reply.find({ reviewId: review._id }).populate('userId');
            return { ...review, replies };
        }));

        res.status(200).send({
            reviews: reviewsWithReplies,
            ratingsSummary: ratingsSummary,
            totalReviews: totalReviews,
            totalRatingValue: totalRatingValue,
            averageRating: averageRating
        });
    } catch (error) {
        console.log("error", error);
        res.status(500).send({ message: 'Error retrieving reviews', error: error.message });
    }
},



likeReview: async(req,res)=>{
    try {
        const reviewId = req.params.id;
        let userId = req.token._id;
        // Add userId to the likes array if it's not already there
        const result = await Review.findByIdAndUpdate(reviewId, {
            $addToSet: { likes: userId }
        }, { new: true }); // Returns the updated document

        if (!result) {
            return res.status(404).send('Review not found');
        }
       return res.status(200).json(result);
    } catch (error) {
        console.log("error",error)
       return res.status(500).send(error);
    }
},
unlikeReview: async(req,res)=>{
    try {
        const reviewId = req.params.id;
        let userId = req.token._id;
        // Remove userId from the likes array
        const result = await Review.findByIdAndUpdate(reviewId, {
            $pull: { likes: userId }
        }, { new: true }); // Returns the updated document

        if (!result) {
            return res.status(404).send('Review not found');
        }
        return res.status(200).json(result);
    } catch (error) {
        console.log("error", error)
        return res.status(500).send(error);
    }
},

replyReview:async(req,res)=>{
    const reviewId = req.params.id;
    let userId = req.token._id;
    const { text } = req.body;

    if (!text || !reviewId || !userId) {
        return res.status(400).send('All fields are required');
    }

    const newReply = new Reply({
        text,
        reviewId,
        userId
    });

    try {
        const savedReply = await newReply.save();
       return res.status(201).json(savedReply);
    } catch (error) {
        console.log("error",error)
        return res.status(500).send(error);
    }
},

getReviewReply: async(req,res)=>{
    const reviewId = req.params.id;

    try {
        const replies = await Reply.find({ reviewId }).populate('userId'); // Populating 'userId' to fetch user details, adjust as needed
        if (replies.length === 0) {
            return res.status(404).send('No replies found for this review');
        }
        res.status(200).json(replies);
    } catch (error) {
        res.status(500).send(error.message);
    }
}
}
module.exports = methods