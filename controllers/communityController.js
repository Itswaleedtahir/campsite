const community = require('../models/communities');
const chatroom = require("../models/chatroom")
const axios = require('axios');
const chatServer = process.env.CHAT_SERVER
let methods = {
  createCommunity: async (req, res) => {
    try {
      const { name,image } = req.body;
      if (!name) {
        return res.status(400).send({ message: 'Community name is required.' });
      }
      const newCommunity = new community({ name, image,followers: [] });
      await newCommunity.save();
      // Data to be sent to the create group API
      const groupData = {
        name: newCommunity.name, // or dynamic based on some condition or input
        involved_persons: [],
        communityId: newCommunity._id.toString(), // Assuming _id is the identifier
        img_url: "" // Add URL if available
      };
      // Headers for the API request
      const config = {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`, // Assuming the token is sent in the Authorization header of the incoming request
          'Content-Type': 'application/json'
        }
      };

        // Post request to create group
        const groupApiUrl = `${chatServer}/chat/chat/`;
        const response = await axios.post(groupApiUrl, groupData, config);
        
        // Optionally handle the response from the group creation
        console.log('Group created:', response.data);

      return  res.status(201).send({ newCommunity, groupData: response.data });
      
    } catch (error) {
      console.log("Error",Error)
    return  res.status(500).send({ message: 'Error creating community', error });
    }
  },
  getAllCommunities: async (req, res) => {
    try {
      const communities = await community.find(); // This will fetch all communities
     return res.status(200).send(communities);
    } catch (error) {
     return res.status(500).send({ message: 'Error fetching communities', error: error.message });
    }
  },
   followCommunity : async (req, res) => {
    const { communityId } = req.params;
    const userId = req.token._id; // Assuming user ID is passed in the token

    if (!userId) {
        return res.status(400).send({ message: 'User ID is required in the header.' });
    }

    try {
        const communityData = await community.findById({ _id: communityId });
        if (!communityData) {
            return res.status(404).send({ message: 'Community not found.' });
        }

        // Add user to followers array if not already present
        if (!communityData.followers.includes(userId)) {
            communityData.followers.push(userId);
            await communityData.save();
        }

        // Retrieve the chatRoomId from the chatroom table
        const chatRoomData = await chatroom.findOne({ communityId: communityId });
        if (!chatRoomData) {
            return res.status(404).send({ message: 'Chat room not found for this community.' });
        }

        const chatRoomId = chatRoomData._id;

        // Prepare data for the API to add user to the group
        const groupData = {
            involved_persons: [userId],
            chatRoomId: chatRoomId
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`, // Token for authorization
                'Content-Type': 'application/json'
            }
        };

        // API endpoint to add user to the group
        const addGroupUrl = `${chatServer}/chat/chat/user`;
        const response = await axios.post(addGroupUrl, groupData, config);

        return res.status(200).send({ communityData, groupAdded: response.data });
    } catch (error) {
      console.log("error",error)
       return res.status(500).send({ message: 'Error following community', error: error.message });
    }
},
unfollowCommunity: async (req, res) => {
  const { communityId } = req.params;
  const userId = req.token._id; // Assuming user ID is passed in the token

  if (!userId) {
      return res.status(400).send({ message: 'User ID is required in the header.' });
  }

  try {
      // Retrieve community and check if it exists
      const communityData = await community.findById(communityId); // Ensure correct ID usage
      if (!communityData) {
          return res.status(404).send({ message: 'Community not found.' });
      }

      console.log("Initial followers:", communityData.followers);

      // Remove user from followers array if present
      if (communityData.followers.includes(userId.toString())) { // Ensuring comparison as strings
          const newFollowers = communityData.followers.filter(followerId => followerId.toString() !== userId.toString());
          communityData.followers = newFollowers;
          await communityData.save();
          console.log("Updated followers:", communityData.followers);
      } else {
          return res.status(400).send({ message: 'User not following this community.' });
      }

      // Retrieve the chatRoomId from the chatroom table
      const chatRoomData = await chatroom.findOne({ communityId: communityId });
      if (!chatRoomData) {
          return res.status(404).send({ message: 'Chat room not found for this community.' });
      }

      const chatRoomId = chatRoomData._id;

      // Prepare data for the API to remove user from the group
      const groupData = {
          involved_person: userId,
          chatRoomId: chatRoomId
      };

      const config = {
          headers: {
              'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`, // Token for authorization
              'Content-Type': 'application/json'
          }
      };

      // API endpoint to remove user from the group
      const removeGroupUrl = `${chatServer}/chat/chat/user`;
      const response = await axios.delete(removeGroupUrl, { data: groupData, headers: config.headers });

      return res.status(200).send({ communityData, groupRemoved: response.data });
  } catch (error) {
      console.log("Error:", error);
      return res.status(500).send({ message: 'Error unfollowing community', error: error.message });
  }
},


  getUserFollowedCommunity: async (req, res) => {
    const { userId } = req.params;

    try {
      // Find all communities where the followers array contains the userId
      const communities = await community.find({
        followers: userId
      });

      if (communities.length === 0) {
        return res.status(404).send({ message: 'No communities found for this user.' });
      }

    return  res.status(200).send(communities);
    } catch (error) {
      console.error("Error:", error);
     return res.status(500).send({ message: 'Error retrieving communities', error: error.message });
    }
  }
}

module.exports = methods