const item = require('../models/rewardItems')
const User = require("../models/userModel");
const services = require("../helpers/services");

const methods = {
    createItem : async(req,res)=>{
        try {

            const {name,image,prize}=req.body

            const itemAdded = await item.create({
                name:name,
                image:image,
                prize:prize
            })

            return res.status(200).send("item Created")
            
        } catch (error) {
            console.log("error",error)
            return res.status(500).send({ message: 'Error creating the item', error: error.message });
        }
    },
    getItems:async(req,res)=>{
        try {
            const items = await item.find({})
            return res.status(201).send(items)
        } catch (error) {
            console.log("error",error)
            return res.status(500).send({ message: 'Error fetching the item', error: error.message });
        }
    },
    deleteItems:async(req,res)=>{
        try {
            const result = await item.findByIdAndDelete(req.params.id);
            if (result) {
              return  res.status(200).json({ message: 'Reward item deleted successfully' });
            } else {
              return  res.status(404).json({ message: 'Reward item not found' });
            }
        } catch (error) {
            console.log("error",error)
           return res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
    buyItems:async(req,res)=>{
        let userId = req.token._id;
        const { itemId, contactNo, address } = req.body;
        try {
            const user = await User.findById(userId);
            const rewardItem = await item.findById(itemId);
            console.log("item",rewardItem)
            if (!user || !rewardItem) {
                return res.status(404).json({ message: 'User or Reward Item not found' });
            }
    
            if (user.rewardPoints < rewardItem.prize) {
                return res.status(400).json({ message: 'Not enough reward points' });
            }
    
            // Deduct reward points
            user.rewardPoints -= rewardItem.prize;
            await user.save();
            await services.sendItemBuyEmail(user,contactNo,address,rewardItem)
            
           return res.status(200).json({ message: 'Reward item purchased successfully' });
        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports=methods