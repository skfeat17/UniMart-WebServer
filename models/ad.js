import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    image: [{ type: String, trim: true }],
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },   
    price: {
      type: Number,
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isPhoneVisible: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      trim: true
    },
    intrestShown: {
      type: Number,
      default: 0
    },
    reports: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Ad", adSchema);
