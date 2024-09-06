const Review = require("../models/reviews")
const User = require("../models/userModel")
const Campsite = require("../models/campsites")
const mongoose = require('mongoose');


let methods = {
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

        // Create a new review
        const newReview = new Review({
            text: req.body.text,
            rating: req.body.rating,
            userId: user._id,
            campsiteId: req.body.campsiteid,
            images: req.body.imageUrl,
            videos: req.body.videoUrl
        });

        const savedReview = await newReview.save();

        
        // Calculate reward points based on review content
        let rewardPoints = 1; // Base point for adding a review with text
        if (req.body.imageUrl && req.body.imageUrl.length > 0) rewardPoints += 2; // Additional points for image
        if (req.body.videoUrl && req.body.videoUrl.length > 0) rewardPoints += 4; // Additional points for video

        // Update the user's reward points
        user.rewardPoints += rewardPoints;
        
        // Update the user's level based on the new reward points
        await user.updateUserLevel();

        await user.save();

        // Update the campsite review stats
        const campsite = await Campsite.findById(req.body.campsiteid);
        if (!campsite) {
            return res.status(404).send({ message: 'Campsite not found' });
        }

        const totalReviews = campsite.reviewStats.totalReviews + 1;
        const newAverageRating = ((campsite.reviewStats.averageRating * (totalReviews - 1)) + req.body.rating) / totalReviews;

        campsite.reviewStats.averageRating = newAverageRating;
        campsite.reviewStats.totalReviews = totalReviews;

        await campsite.save();

        res.status(201).send(savedReview);
    } catch (error) {
        console.log("error", error);
       return res.status(500).send({ message: 'Error creating the review', error: error.message });
    }
},

  
  getReviewsForSingleCampsites: async(req, res) => {
    try {
        const campsiteId = req.params.campsiteId;
        console.log("id", campsiteId);

        // Aggregate to get ratings summary and overall stats
        const reviewsData = await Review.aggregate([
            { $match: { campsiteId: new mongoose.Types.ObjectId(campsiteId) } },
            {
                $group: {
                    _id: null, // Group all to calculate total stats
                    totalReviews: { $sum: 1 },
                    totalRatingValue: { $sum: "$rating" },
                    ratings: {
                        $push: {
                            rating: "$rating",
                            count: 1
                        }
                    }
                }
            },
            {
                $unwind: "$ratings"
            },
            {
                $group: {
                    _id: "$ratings.rating",
                    count: { $sum: "$ratings.count" }
                }
            }
        ]);

        // Compute the average rating
        const totalReviews = reviewsData.reduce((acc, curr) => acc + curr.count, 0);
        const totalRatingValue = reviewsData.reduce((acc, curr) => acc + (curr._id * curr.count), 0);
        const averageRating = totalRatingValue / totalReviews;

        // Format ratings summary
        const ratingsSummary = {};
        reviewsData.forEach(item => {
            ratingsSummary[item._id] = item.count;
        });

        // Find reviews and populate user details
        const reviews = await Review.find({ campsiteId: campsiteId }).populate('userId');  // Populate user

        res.status(200).send({
            reviews: reviews,
            ratingsSummary: ratingsSummary,
            totalReviews: totalReviews,
            totalRatingValue: totalRatingValue,
            averageRating: averageRating
        });
    } catch (error) {
        console.log("error", error);
        res.status(500).send({ message: 'Error retrieving reviews', error: error.message });
    }
}

}
module.exports = methods