import Ad from "../models/ad.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import mongoose from "mongoose";
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
  const { title, description, price, location, isPhoneVisible } = req.body;
  const adId = req.params.id

  if (!title && !description && price == null && !location && isPhoneVisible === undefined) {
    throw new ApiError(400, "At least one field is required to update");
  }
  const updatedAd = await Ad.findByIdAndUpdate(adId, { title, description, price, location, isPhoneVisible }, { new: true });

  if (!updatedAd) {
    throw new ApiError(404, "Ad not found");
  }

  res.status(200).json(new ApiResponse(200, updatedAd, "Ad updated successfully"));
});
//Update Ad Images
export const updateAdImage = asyncHandler(async (req, res) => {
  const adId = req.params.id
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one image is required");
  }
  const imageUrl = [];
  for (const file of req.files) {
    const result = await uploadToCloudinary(file.buffer, "ads");
    imageUrl.push(result.secure_url);
  }
  const updatedAd = await Ad.findByIdAndUpdate(adId, { image: imageUrl }, { new: true });

  res.status(200).json(new ApiResponse(200, updatedAd, "Ad updated successfully"));


})
//Toggle Ad Status
export const toggleAdStatus = asyncHandler(async (req, res) => {
  const adObj = req.ad;
  let newAdObj;
  if (adObj.isActive == true) {
    newAdObj = await Ad.findByIdAndUpdate(adId, { isActive: false }, { new: true })
  }
  else {
    newAdObj = await Ad.findByIdAndUpdate(adId, { isActive: true }, { new: true })
  }
  res.status(200)
    .json(new ApiResponse(200, { newAdObj }, "Ad Status Toggle Successfully"))
})
//Delete Ad
export const deleteAd = asyncHandler(async (req, res) => {
  await Ad.findByIdAndDelete(req.adId);
  res.status(200)
    .json(new ApiResponse(200, {}, "Ad Deleted Successfully"))
})
//Show All Ads
export const showAllAds = asyncHandler(async (req, res) => {
  const adsArray = await Ad.aggregate(
    [
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 0,
                avatar: 1,
                name: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: "$owner"
        }
      },
      {
        $sort: {
          createdAt: -1,
          intrestShown: -1
        }
      }
    ]
  )
  if (!adsArray) {
    throw new ApiError(500, "Error Occurred while fetching the ads")
  }
  res.status(200).json(new ApiResponse(200, adsArray, "Ads Fetched Successfully"))
})
//SHOW ADS BY CATEGORY
export const showAdsByCat = asyncHandler(async (req, res) => {
  const adsArray = await Ad.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "sellerId",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 0,
              avatar: 1,
              name: 1
            }
          }
        ]
      }
    },
    {
      $unwind: {
        path: "$owner"
      }
    },
    {
      $sort: {
        createdAt: -1,
        intrestShown: -1
      }
    }, {
      $group: {
        _id: "$category",
        items: {
          $push: {
            title: "$title",
            description: "$description",
            image: "$image",
            avatar: "$avatar",
            owner: "$owner",
            detail: "$detail",
            location: "$location",
            price: "$price",
            intrestShown: "$intrestShown",
            createdAt: "$createdAt"
          }
        }
      }
    }

  ]
  )
  if (!adsArray) {
    throw new ApiError(500, "Error Occurred while fetching the ads")
  }
  res.status(200).json(new ApiResponse(200, adsArray, "Ads Fetched Successfully with Category"))
})
export const getAdById = asyncHandler(async (req, res) => {
  const adId = req.params.id;
  await Ad.findByIdAndUpdate(
    adId,
    { $inc: { intrestShown: 1 } },
    { new: true }
  );

  const adObj = await Ad.aggregate(
    [
      { $match: { _id: new mongoose.Types.ObjectId(adId) } },
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 0,
                avatar: 1,
                name: 1,
                phone: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: "$owner"
        }
      },
      {
        $sort: {
          createdAt: -1,
          intrestShown: -1
        }
      }
    ]
  )
  if (!adObj) {
    throw new ApiError(500, "Error Occurred while fetching the ads")
  }
  res.status(200).json(new ApiResponse(200, adObj[0], "Ad Fetched Successfully"))
})