const Review = require("../models/reviews")
const User = require("../models/userModel")
const Campsite = require("../models/campsites")
const mongoose = require('mongoose');


let methods = {
    addReview: async(req,res)=>{
        try {
            let _id = req.token._id;
            let user = await User.findOne({ _id });
            if (!user) {
              return res.status(404).json({
                msg: "User not found with this id",
                success: false,
              });
            }
            console.log("id",_id)
            console.log("user",user)
              // Check if a review from the same user for the same campsite already exists
                const existingReview = await Review.findOne({
                    userId:user._id,
                    campsiteId: req.body.campsiteid
                });
            
                if (existingReview) {
                    return res.status(409).send({ message: 'You have already reviewed this campsite.' });
                }
            const newReview = new Review({
              text: req.body.text,
              rating: req.body.rating,
              userId:user._id,
              campsiteId: req.body.campsiteid,
              images:req.body.imageUrl,
              videos:req.body.videoUrl
            });
        
            const savedReview = await newReview.save();

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
            console.log("error",error)
            res.status(500).send({ message: 'Error creating the review', error: error.message });
          }
    },
    getReviewsForSingleCampsites:async(req, res)=>{
      try {
          const campsiteId = req.params.campsiteId;
          console.log("id", campsiteId);
  
          // Aggregate to get ratings summary
          const reviewsData = await Review.aggregate([
              { $match: { campsiteId: new mongoose.Types.ObjectId(campsiteId) } },  // Ensure this matches your schema (campsiteId)
              {
                  $group: {
                      _id: '$rating',
                      count: { $sum: 1 }
                  }
              }
          ]);
  
          // Find reviews and populate user details
          const reviews = await Review.find({ campsiteId: campsiteId })
                                      .populate('userId');  // Populate user name and email
  
          res.status(200).send({
              reviews: reviews,
              ratingsSummary: reviewsData.reduce((acc, item) => {
                  acc[item._id] = item.count; // Format summary to be more readable
                  return acc;
              }, {})
          });
      } catch (error) {
          console.log("error", error);
          res.status(500).send({ message: 'Error retrieving reviews', error: error.message });
      }
  }
}
module.exports = methods