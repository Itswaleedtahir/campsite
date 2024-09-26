const Affiliate = require("../models/Affiliate")
const User = require("../models/userModel")
const services = require("../helpers/services");
let methods = {
    affiliateRequest:async(req,res)=>{
       try {
        let _id = req.token._id;
        const {followers, url,platform} = req.body
        let user = await User.findOne({ _id });
        if (!user) {
            return res.status(404).json({
                msg: "User not found with this id",
                success: false,
            });
        }
        if(user.subscriptionStatus != "active"){
            return res.status(404).json({
                msg: "For Affiliate Program you need to Subscribe.",
                success: false,
            });
        }
         // Check if the affiliate request already exists for this user
         const existingAffiliate = await Affiliate.findOne({ userId: _id });
         if (existingAffiliate) {
             return res.status(409).json({
                 msg: "Affiliate request already submitted.",
                 success: false
             });
         }
        console.log("user",user.referralCode)
        const affiliate = await Affiliate.create({
            userId:_id,
            followers:followers,
            platform:platform,
            link:url,
            promoCode:user.referralCode
        })
        return res.status(200).json({
            msg: "Affiliate request submitted.",
            success: true
        });

       } catch (error) {
        console.error("Error handling file upload:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
       }
    },
    getAffiliateRequests:async(req,res)=>{
        try {
            const affiliates = await Affiliate.find({}).populate('userId'); // Populate user details, adjust fields as needed
            res.status(200).json({
                success: true,
                count: affiliates.length,
                data: affiliates
            });
        } catch (error) {
            console.error("Failed to fetch affiliates:", error);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    },
    updateAffiliateRequest:async(req,res)=>{
        const { id } = req.query;
        try {
            console.log("id",id)
            const { status, percentage } = req.body;
            const updateData = { status, percentage }; // Combine status and percentage into one object
            const affiliate = await Affiliate.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true, runValidators: true }
            ).populate('userId');
            if (!affiliate) {
                return res.status(404).json({
                    success: false,
                    message: 'Affiliate not found'
                });
            }
            res.status(200).json({
                success: true,
                data: affiliate
            });
        } catch (error) {
            console.error("Error updating affiliate:", error);
            if (error.kind === 'ObjectId') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ID format'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Internal Server Error'
            });
        }
    },
    calculateCommission:async(req,res)=>{
        const { affiliateId } = req.query;

        try {
            console.log("id",affiliateId)
            const affiliate = await Affiliate.findById(affiliateId);
            if (!affiliate) {
                return res.status(404).json({
                    success: false,
                    message: 'Affiliate not found'
                });
            }
    
            const subscriptionCost = 60; // cost of one subscription
            const { percentage, userInvited } = affiliate;
    
            // Calculate the commission
            const totalCommission = (percentage / 100) * subscriptionCost * userInvited;
    
            // Update the commission in the database
        affiliate.commission = totalCommission;
        await affiliate.save();

        return res.status(200).json({
            success: true,
            commission: totalCommission.toFixed(2), // Formats the commission to 2 decimal places
            message: 'Commission calculated and updated successfully'
        });
        } catch (error) {
            console.error("Error fetching affiliate details:", error);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error'
            });
        }
    },
    sendCommissionEmail:async(req,res)=>{
        const { affiliateId } = req.query;

    try {
        const affiliate = await Affiliate.findById(affiliateId).populate('userId');
        if (!affiliate) {
            return res.status(404).json({
                success: false,
                message: 'Affiliate not found'
            });
        }

        console.log("affiloiate",affiliate)
        const commission = affiliate.commission
        const userInvited = affiliate.userInvited
        // Send commission notification email with number of invited users
        await services.sendCommissionNotificationEmail(affiliate.userId, commission, userInvited, res);

        return res.status(200).json({
            success: true,
            message: 'Commission notification email sent successfully'
        });
    } catch (error) {
        console.error("Error processing commission notification:", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
    }
}
module.exports = methods;