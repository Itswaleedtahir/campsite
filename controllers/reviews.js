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

        // Aggregate to get ratings summary
        const reviewsData = await Review.aggregate([
            { $match: { campsiteId: new mongoose.Types.ObjectId(campsiteId) } },
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

        // Find reviews and populate user details
        const reviews = await Review.find({ campsiteId: new mongoose.Types.ObjectId(campsiteId) }).populate('userId');

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