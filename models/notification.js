import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    severity: {
      type: String,
      enum: ["info", "warning", "error"],
      default: "info"
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    message: {
      type: String,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Notification", notificationSchema);
