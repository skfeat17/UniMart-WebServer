import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import Ad from "../models/ad.js";

export const verifyAdOwnerShip = async (req, res, next) => {
  try {
    const adId = req.params.id;
    if(!adId){
        return next(new ApiError(404, "Ad Id Not Found"));
    }
    const adPost = await Ad.findById(adId);
    if(!adPost){
           return next(new ApiError(404, "Ad No Longer Exists"));
    }
    const sellerId = adPost.sellerId;
    const token =
      req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new ApiError(401, "Unauthorized request"));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded._id;
    if(userId!=sellerId){
           return next(new ApiError(401, "Ad Ownership Verification Failed"));
    }
    req.ad = adPost;
    req.adId = adPost._id
    next();

  } catch (error) {
    console.error("JWT error:", error.message); // optional
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

