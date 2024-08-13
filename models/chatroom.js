const mongoose = require("mongoose");
const chatroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",
    },
    communityId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"communities"
    },
    involved_persons: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
      },
    ],
    roomType: {
      type: String,
      enum: ["private", "group"],
      default: "group",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",
    },
    admins: [{
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",
    }],
    //group admin keys
    createdAt: {
      type: Date,
      required: true,
      default: new Date().toUTCString(),
    },
    img_url: {
      type: mongoose.Schema.Types.String,
      default: "https://dummyimage.com/35x35/E4FFDE/A8DC9B.jpg&text=G",
    },
    chat: [{
      type: mongoose.Schema.Types.ObjectId,

      ref: "Message",
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chatroom", chatroomSchema);
