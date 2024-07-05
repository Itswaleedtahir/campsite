let community = require('../models/communities');


let methods = {
    createCommunity:async(req,res)=>{
        try {
            const { name } = req.body;
            if (!name) {
              return res.status(400).send({ message: 'Community name is required.' });
            }
            const newCommunity = new community({ name, followers: [] });
            await newCommunity.save();
            res.status(201).send(newCommunity);
          } catch (error) {
            res.status(500).send({ message: 'Error creating community', error: error.message });
          }
    },
    getAllCommunities:async(req,res)=>{
        try {
            const communities = await community.find(); // This will fetch all communities
            res.status(200).send(communities);
          } catch (error) {
            res.status(500).send({ message: 'Error fetching communities', error: error.message });
          }
    },
    followCommunity:async(req,res)=>{
        const { communityId } = req.params;
        console.log("id",communityId)
        const userId = req.token._id; // Assuming user ID is passed in the header
  console.log("user",userId)

  if (!userId) {
    return res.status(400).send({ message: 'User ID is required in the header.' });
  }

  try {
    const communityData = await community.findById({_id:communityId});
    console.log("community",communityData)
    if (!communityData) {
      return res.status(404).send({ message: 'Community not found.' });
    }
    // Add user to followers array if not already present
    if (!communityData.followers.includes(userId)) {
        communityData.followers.push(userId);
      await communityData.save();
    }
    res.status(200).send(communityData);
  } catch (error) {
    res.status(500).send({ message: 'Error following community', error: error.message });
  }
    },
    getUserFollowedCommunity:async(req,res)=>{
        const { userId } = req.params;

        try {
            // Find all communities where the followers array contains the userId
            const communities = await community.find({
                followers: userId
            });
    
            if (communities.length === 0) {
                return res.status(404).send({ message: 'No communities found for this user.' });
            }
    
            res.status(200).send(communities);
        } catch (error) {
            console.error("Error:", error);
            res.status(500).send({ message: 'Error retrieving communities', error: error.message });
        }
    }
}

module.exports = methods