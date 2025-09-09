import Ad from "../models/ad.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

//Post a New Ad
export const postAd = asyncHandler(asyncHandler(async (req, res) => {
  const { title, description, price, category, location } = req.body;

  if (!title || !description || !price || !category || !location) {
    throw new ApiError(400, "All fields are required");
  } 
    if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one image is required");
    }
    const imageUrl = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, "ads");
      imageUrl.push(result.secure_url);
    }

  const ad = await Ad.create({
    sellerId: req.user._id,
    image: imageUrl,
    title: title.trim(),
    description: description.trim(),
    price,
    category: category.trim(),
    location: location.trim()
  });   
    res.status(201).json(new ApiResponse(201, ad, "Ad posted successfully"));
}));
//Update Ad Details
export const updateAd = asyncHandler(async (req, res) => {
  const { title, description, price,location,isPhoneVisible } = req.body;
  const adId = req.params.id

  if (!title && !description && price == null&&!location&&isPhoneVisible === undefined) {
    throw new ApiError(400, "At least one field is required to update");
  }
  const updatedAd = await Ad.findByIdAndUpdate(adId, {title,description,price,location,isPhoneVisible}, { new: true });

  if (!updatedAd) {
    throw new ApiError(404, "Ad not found");
  }

  res.status(200).json(new ApiResponse(200, updatedAd, "Ad updated successfully"));
});
//Update Ad Images
export const updateAdImage = asyncHandler(async (req,res) => {
    const adId = req.params.id
    if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one image is required");
    }
        const imageUrl = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, "ads");
      imageUrl.push(result.secure_url);
    }
      const updatedAd = await Ad.findByIdAndUpdate(adId, {image:imageUrl}, { new: true });

  res.status(200).json(new ApiResponse(200, updatedAd, "Ad updated successfully"));
  

})
