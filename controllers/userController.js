const User = require("../models/userModel");
let bcrypt = require("bcrypt");
const Campsites = require("../models/campsites")
const crypto = require('crypto');
let utils = require("../utils/index");
const services = require("../helpers/services");
const axios = require('axios');
const jwt = require("jsonwebtoken");

let methods = {
  addUser: async (req, res) => {
    try {
      let data = req.body;
      if (!data) {
        return res.status(400).json({
          msg: "Please provide user data",
          success: false,
        });
      }
      console.log("data",data)
      let referrer
      if(data.referralCode){
        referrer =await User.findOne({referralCode:data.referralCode}
        )
      }

      let userData = await User.findOne({ email: data.email });
      if (userData) {
        return res.status(404).json({
          msg: "User already exists",
          success: false,
        });
      }
  
      // Generate a 4-digit OTP
      const otp = crypto.randomInt(1000, 9999);
  
      // Hash the password
      data.password = await bcrypt.hash(data.password, 10);
  
      // Generate a unique referral code
      data.referralCode = crypto.randomBytes(8).toString('hex');

      // Add the OTP to the user data
      data.otp = otp;
      if(referrer){
      data.referredBy = referrer._id
      }
      let user = new User(data);
      let addUser = await user.save();
      if (!addUser) {
        return res.status(500).json({
          msg: "Failed to add user",
          success: false,
        });
      }
  
      // Send the OTP email
      await services.sendVerificationEmail(data.email, otp, res);
  
    return  res.status(200).json({
        user: addUser,
        msg: "OTP sent to your email",
        success: true,
      });
    } catch (error) {
      console.log("error",error)
    return  res.status(500).json({
        msg: "Failed to add user",
        error: error.message || "Something went wrong.",
        success: false,
      });
    }
  },

  verifyUser: async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                msg: "Please provide both email and OTP",
                success: false,
            });
        }

        // Find the user by email
        let user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({
                msg: "User not found",
                success: false,
            });
        }

        // Check if the OTP matches
        if (user.otp !== otp) {
            return res.status(401).json({
                msg: "Invalid OTP",
                success: false,
            });
        }

        // Verify the user and update isVerified to true
        user.isVerified = true;
        user.otp = null; // Clear the OTP field after successful verification
        await user.save();

        // If the user was referred, add points to the referrer
        if (user.referredBy) {
            let referrer = await User.findById(user.referredBy);
            console.log("referrer", referrer);
            if (referrer) {
                referrer.rewardPoints += 5; // Assuming 5 points per successful referral
                 // Save referrer's updated points
                 await referrer.save();
                // Update the referrer's level based on the new points
                await referrer.updateUserLevel();
            }
        }

       return res.status(200).json({
            msg: "User verified successfully",
            success: true,
        });
    } catch (error) {
       return res.status(500).json({
            msg: "Failed to verify user",
            error: error.message || "Something went wrong.",
            success: false,
        });
    }
},
 resendOTP :async (req, res) => {
  try {
      const { email } = req.body;
      if (!email) {
          return res.status(400).json({
              msg: "Email is required",
              success: false,
          });
      }

      // Find the user by email
      let user = await User.findOne({ email: email });
      if (!user) {
          return res.status(404).json({
              msg: "User not found",
              success: false,
          });
      }

      // Generate a new OTP
      const newOtp = crypto.randomInt(1000, 9999) // Generate a 6-digit OTP

      // Update the user's OTP
      user.otp = newOtp;
      await user.save();
       // Send the OTP email
       await services.ResendVerificationEmail(email, newOtp, res);
    return  res.status(200).json({
          msg: "OTP resent successfully",
          otp:newOtp,
          success: true,
      });
  } catch (error) {
     return res.status(500).json({
          msg: "Failed to resend OTP",
          error: error.message || "Something went wrong.",
          success: false,
      });
  }
},

  loginUser: async (req, res) => {
    try {
      let data = req.body;
      let email = data.email;
      let password = data.password;
      if (!email || !password) {
        return res.status(401).json({
          msg: "Please enter right Credentials!",
          success: false,
        });
      }
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          msg: "User with this email does not exist",
          success: false,
        });
      }
      console.log("user",user)
      // Check if the user is verified
      if (!user.isVerified) {
        return res.status(403).json({
          msg: "Please verify your email to login",
          success: false,
        });
      }
  
      let match = await utils.comparePassword(password, user.password);
      if (!match) {
        return res.status(401).json({
          msg: "Wrong Password Entered",
          success: false,
        });
      }
  
      let access_token = await utils.issueToken({
        _id: user._id,
        email:user.email,
        firstLogin:user.firstLogin
      });
  
      let result = {
        user: {
          _id: user._id,
          email: email,
          subscriptionStatus:user.subscriptionStatus,
          isPaid:user.isPaid,
          firstLogin:user.firstLogin,
          subscriptionId:user.subscriptionId,
          imageUrl: user.imageUrl || "",
          recommendationData:user.recommendationData
        },
        access_token,
      };
  
      return res.status(200).json({ success: true, result });
    } catch (error) {
      return res.status(500).json({
        msg: "Login Failed",
        error: error.message,
        success: false,
      });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      let email = req.body.email;
      let findUser = await User.findOne({ email: email });
      if (!findUser) {
        return res.status(404).json({
          msg: "User with this Email does not exist",
          success: false,
        });
      }
       // Generate a new OTP
       const newOtp = crypto.randomInt(1000, 9999) // Generate a 6-digit OTP
      let updateUser = await User.findOneAndUpdate(
        { email: email },
        { $set: { otp: newOtp } },
        { new: true }
      );
      services.sendResetPasswordMail(findUser.email, newOtp);
     return res.status(200).json({
        msg: "Reset Email Have been sent",
        success: true,
      });
    } catch (error) {
     return res.status(500).json({
        msg: error.message,
        success: false,
      });
    }
  },
  resetPassword: async (req, res) => {
    try {
      let email = req.body.email;
      let findUser = await User.findOne({ email: email });
      if (!findUser) {
        return res.status(200).json({
          msg: "User not found",
          success: true,
        });
      }
      let password = req.body.password;
      let match = await utils.comparePassword(password, findUser.password);
      if (match) {
        return res.status(400).json({
          msg: "Old password cannot be set as new password",
          success: false,
        });
      }
      let newPassword = await bcrypt.hash(password, 10);
      let user = await User.findByIdAndUpdate(
        { _id: findUser._id },
        { $set: { password: newPassword, otp: "" } },
        { new: true }
      );
      return res.status(200).json({
        msg: "User Password Have been Reset",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        msg: error.message,
        success: false,
      });
    }
  },
  changePassword: async (req, res) => {
    try {
      let _id = req.token._id;
      let data = req.body;
      let password = data.password;
      let user = await User.findOne({ _id });
      if (!user) {
        return res.status(404).json({
          msg: "User not found with this id",
          success: false,
        });
      }
      let userId = user._id;
      let match = await utils.comparePassword(password, user.password);
      if (!match) {
        return res.status(400).json({
          msg: "The password you entered does not match your real password! Input Correct Password",
          success: false,
        });
      }
      data.password = await bcrypt.hash(data.newPassword, 10);
      let samePassword = await utils.comparePassword(
        data.newPassword,
        user.password
      );
      if (samePassword) {
        return res.status(400).json({
          msg: "Old and new password cannot be same",
          success: false,
        });
      }
      let updatePassword = await User.findOneAndUpdate(
        { _id: userId },
        {
          password: data.password,
        }
      );
      return res.status(200).json({
        msg: "Password Updated",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to Change Password",
        error: error.message,
        success: false,
      });
    }
  },
  getUserDetails: async (req, res) => {
    let userId = req.token._id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        await user.updateUserLevel(); // Ensure the user's level is updated

        res.status(200).json(user);
    } catch (error) {
        res.status(500).send({ message: "Error retrieving user data", error: error.message });
    }
},
  viewUser: async (req, res) => {
    try {
      let userId = req.query.id;
      let user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          msg: "User not found",
          success: false,
        });
      }
      res.status(200).json({
        user: user,
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        msg: "Failed to view user",
        error: error.message || "Something went wrong.",
        success: false,
      });
    }
  },
  getAllUsers:async (req,res)=>{
    try {
      const users = await User.find({});
      return res.status(201).json(users);
  } catch (error) {
     return res.status(500).json({ error: error.toString() });
  }
  },
  updateUser: async (req, res) => {
    try {
        let userId = req.query.id;
        console.log("id", userId);
        let data = req.body;
        console.log("data",req.body)
        if (!data) {
            return res.status(400).json({
                msg: "Please provide user data to update",
                success: false,
            });
        }

        // Update the user data
        let updateUser = await User.findByIdAndUpdate(userId, data, {
            new: true,
        });

        if (!updateUser) {
            return res.status(404).json({
                msg: "User not found",
                success: false,
            });
        }

        // Check if rewardPoints was updated and update the user's level if necessary
        if (data.rewardPoints !== undefined) {
            await updateUser.updateUserLevel();
            await updateUser.save(); // Save the user with the updated level
        }

        res.status(200).json({
            user: updateUser,
            msg: "User updated successfully",
            success: true,
        });
    } catch (error) {
        res.status(500).json({
            msg: "Failed to update user",
            error: error.message || "Something went wrong.",
            success: false,
        });
    }
},

  addToFavourites:async(req,res)=>{
    let userId = req.token._id;
      console.log("id",userId)
    const { campsiteId } = req.body;

    if (!userId || !campsiteId) {
        return res.status(400).send({ message: 'Missing user ID or campsite ID' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { favourites: campsiteId } },
            { new: true } // Return the updated document
        );
        const updatedCampsite = await Campsites.findByIdAndUpdate(
          campsiteId,
          { $addToSet: { wishlistUsers: userId } },
          { new: true }
      );

        if (!updatedUser) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.status(200).send(updatedUser);
    } catch (error) {
        console.log('Error adding to favourites:', error);
        res.status(500).send({ message: 'Error adding to favourites', error: error.message });
    }
  },
  addToWishlist:async(req,res)=>{
    let userId = req.token._id;
      console.log("id",userId)
    const { campsiteId } = req.body;

    if (!userId || !campsiteId) {
        return res.status(400).send({ message: 'Missing user ID or campsite ID' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { wishlist: campsiteId } },
            { new: true } // Return the updated document
        );
        const updatedCampsite = await Campsites.findByIdAndUpdate(
          campsiteId,
          { $addToSet: { wishlistUsers: userId } },
          { new: true }
      );

        if (!updatedUser) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.status(200).send(updatedUser);
    } catch (error) {
        console.log('Error adding to favourites:', error);
        res.status(500).send({ message: 'Error adding to favourites', error: error.message });
    }
  },
  removeFromFavourites: async (req, res) => {
    let userId = req.token._id;
    console.log("id", userId);
    const { campsiteId } = req.body;

    if (!userId || !campsiteId) {
        return res.status(400).send({ message: 'Missing user ID or campsite ID' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { favourites: campsiteId } },
            { new: true } // Return the updated document
        );
        const updatedCampsite = await Campsites.findByIdAndUpdate(
            campsiteId,
            { $pull: { wishlistUsers: userId } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.status(200).send(updatedUser);
    } catch (error) {
        console.log('Error removing from favourites:', error);
        res.status(500).send({ message: 'Error removing from favourites', error: error.message });
    }
},
removeFromWishlist: async (req, res) => {
    let userId = req.token._id;
    console.log("id", userId);
    const { campsiteId } = req.body;

    if (!userId || !campsiteId) {
        return res.status(400).send({ message: 'Missing user ID or campsite ID' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: campsiteId } },
            { new: true } // Return the updated document
        );
        const updatedCampsite = await Campsites.findByIdAndUpdate(
            campsiteId,
            { $pull: { wishlistUsers: userId } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.status(200).send(updatedUser);
    } catch (error) {
        console.log('Error removing from wishlist:', error);
        res.status(500).send({ message: 'Error removing from wishlist', error: error.message });
    }
},

  getFavourites:async(req,res)=>{
    try {
      let userId = req.token._id;
      const user = await User.findById(userId).populate('favourites');
      if (!user) {
          return res.status(404).send({ message: 'User not found' });
      }
      res.status(200).send(user.favourites);
  } catch (error) {
      console.log('Error retrieving favourites:', error);
      res.status(500).send({ message: 'Error retrieving favourites', error: error.message });
  }
  },
  getWishlist:async(req,res)=>{
    try {
      let userId = req.token._id;
      const user = await User.findById(userId).populate('wishlist');
      if (!user) {
          return res.status(404).send({ message: 'User not found' });
      }
      res.status(200).send(user.wishlist);
  } catch (error) {
      console.log('Error retrieving wishlist:', error);
     return res.status(500).send({ message: 'Error retrieving wishlist', error: error.message });
  }
  },
  googleVerify:async(req,res)=>{
    try {
      const {accessToken}=req.body
      const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      console.log('Response of Google', response.data);
      console.log('Google email is', response.data.email);
    
      const user = {
        email: response.data.email,
        image: response.data.picture,
        social_id: response.data.id,
        first_name: response.data.given_name,
        last_name: response.data.family_name,
        password: `${response.data.email}_${response.data.id}`
      };
      const findUser = await User.findOne({
        googleId:user.social_id
      })
      if(findUser){
        let access_token = await utils.issueToken({
          _id: findUser._id,
          email:findUser.email,
        });
        let result = {
          user: {
            _id: findUser._id,
            email:findUser.email,
            subscriptionStatus:findUser.subscriptionStatus,
            isPaid:findUser.isPaid,
            firstLogin:findUser.firstLogin,
            subscriptionId:findUser.subscriptionId,
            imageUrl: findUser.image,
          }
        };

        return res.status(200).send({message:"User exist",token: access_token,isExist:true ,result:result})
      }else {
        const referralCode = crypto.randomBytes(8).toString('hex');
        const newUser = new User({
          email: user.email,
          googleId: user.social_id,
          firstname: user.first_name,
          lastname: user.last_name,
          image: user.image,
          isVerified:true,
          referralCode:referralCode,
          password:user.password
        });
  
        const savedUser = await newUser.save();
        let access_token = await utils.issueToken({
          _id: savedUser._id,
          email: savedUser.email,
        });
        console.log("user",savedUser)
        let result = {
          user: {
            _id: savedUser._id,
            email:savedUser.email,
            subscriptionStatus:savedUser.subscriptionStatus,
            isPaid:savedUser.isPaid,
            firstLogin:savedUser.firstLogin,
            subscriptionId:savedUser.subscriptionId,
            imageUrl: savedUser.image,
          }
        };
        return res.status(201).json({ message: "User created", token: access_token, isExist:false,result:result });
      }
    
    } catch (error) {
      console.log('Error', error);
      return res.status(500).send({ message: 'Error', error: error.message });
    }
  },
  appleLogin:async(req,res)=>{
    try {
      const { idToken, appleId ,first_name,last_name} = req.body;
      const userData = jwt.decode(idToken)
      console.log("userData",userData)
      const email =
      idToken === null
        ? null
        : jwt.decode(idToken).email == undefined
        ? null
        : jwt.decode(idToken).email;
    // console.log("--> email: ", email);
      console.log("email",email)
      const user = await User.findOne({
        email:email
      })
    if (user) {
      console.log("insideif")
          const access_token = await utils.issueToken({
            _id: user.id,
            email: user.email,
          });
          let result = {
            user: {
              _id: user._id,
              email:user.email,
              subscriptionStatus:user.subscriptionStatus,
              isPaid:user.isPaid,
              firstLogin:user.firstLogin,
              subscriptionId:user.subscriptionId,
              imageUrl: user.image,
            }
          };
          return res.status(200).send({message:"User exist",token: access_token,isExist:true ,result:result})
        
    }else{
      console.log("insideelseeee")
      const referralCode = crypto.randomBytes(8).toString('hex');
        const newUser = new User({
          email: userData.email,
          appleId:appleId,
          firstname: first_name ?? null,  // If first_name is null, it defaults to null
          lastname: last_name ?? null, 
          image: userData?.image,
          isVerified:true,
          referralCode:referralCode,
          password:userData?.password
        });
  
        const savedUser = await newUser.save();
        let access_token = await utils.issueToken({
          _id: savedUser._id,
          email: savedUser.email,
        });
        console.log("user",savedUser)
        let result = {
          user: {
            _id: savedUser._id,
            email:savedUser.email,
            subscriptionStatus:savedUser.subscriptionStatus,
            isPaid:savedUser.isPaid,
            firstLogin:savedUser.firstLogin,
            subscriptionId:savedUser.subscriptionId,
            imageUrl: savedUser.image,
          }
        };
        return res.status(201).json({ message: "User created", token: access_token, isExist:false,result:result });
      }
    } catch (error) {
      console.log('Error', error);
      return res.status(500).send({ message: 'Error', error: error.message });
    }
  },
  referralCheck:async(req,res)=>{
    const {code}=req.body
    let userId = req.token._id;
    try {
      // If the user was referred, add points to the referrer
     const user = await User.findOne({
          referralCode:code
        });
        if (user) {
          user.rewardPoints += 5; // Assuming 5 points per successful referral
          await user.save();
        }
      const updateUser = await User.findByIdAndUpdate(userId, {
        $set: {
          referredBy: user._id
        }
      }, { new: true }); 
      return res.status(201).send({message:"Updated User", user: updateUser})
    } catch (error) {
      console.log('Error', error);
     return res.status(500).send({ message: 'Error', error: error.message });
    }
  }
};
module.exports = methods;