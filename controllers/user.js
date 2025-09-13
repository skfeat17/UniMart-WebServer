import User from "../models/user.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import jwt from "jsonwebtoken"
import { sendEmail } from "../utils/nodemailer.js";
import pkg from "simple-crypto-js";
const { default: SimpleCrypto } = pkg;
const httpOptions = {
  httpOnly: true,
  secure: true,
};
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }


  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}
//REGISTER USER CONTROLLER
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const normalizedEmail = email?.toLowerCase().trim();
  const normalizedName = name?.trim();
  const normalizedPassword = password;

  if (!normalizedName || !normalizedEmail || !normalizedPassword) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: phone }]
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or phone");
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
    phone
  });
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  res.status(201)
    .cookie("accessToken", accessToken, httpOptions)
    .cookie("refreshToken", refreshToken, httpOptions
    ).json(new ApiResponse(
      201,
      {
        user: createdUser,
        accessToken,
        refreshToken
      },
      "User registered successfully"
    ));

});
//LOGIN USER CONTROLLER
const logInUser = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body

  if ((!email && !phone) || !password) {
    throw new ApiError(400, "Email or phone and password are required");
  }

  const user = await User.findOne({ $or: [{ email }, { phone }] })

  if (!user) {
    throw new ApiError(404, "User not found with this email or phone")
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials")
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  res.status(201)
    .cookie("accessToken", accessToken, httpOptions)
    .cookie("refreshToken", refreshToken, httpOptions
    ).json(new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken
      },
      "Log in successful"

    ));
});
//UPLOAD AVATAR
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  // Upload to cloudinary
  const result = await uploadToCloudinary(req.file.buffer, "avatars");

  // Save avatar URL to user
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: result.secure_url },
    { new: true }
  ).select("-password -refreshToken");

  res.status(200).json(
    new ApiResponse(200, user, "Avatar uploaded successfully")
  );
});
//UPDATE USER PROFILE
const updateProfile = asyncHandler(async (req, res) => {
  let { name, phone } = req.body;
  name = name?.trim();
  if (!name && !phone) {
    throw new ApiError(400, "At least one field name or phone number is required to update");
  }
  const user = await User.findById(req.user._id);
  if (phone == user.phone) {
    throw new ApiError(400, "New Phone Number is Required");
  }
  const updatedUser = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true }).select("-refreshToken -password");
  res.status(200)
    .json(new ApiResponse(200, updatedUser, "Details Updated Successfull"))
})
//LOGOUT USER
const logOutUser = asyncHandler(async (req, res) => {
  res
    .clearCookie("accessToken", httpOptions)
    .clearCookie("refreshToken", httpOptions);

  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: "" } },
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, "Logged Out User Successfully"));
});
//REFRESH ACCESS TOKEN
const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(401, "Unauthorized request")
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const storedRefreshToken = user.refreshToken;
  if (!storedRefreshToken) {
    throw new ApiError(404, "No refresh token stored for this user");
  }
  if (storedRefreshToken != token) {
    throw new ApiError(403, "Refresh token is invalid or expired");
  }
  const accessToken = user.generateAccessToken()
  res
    .cookie("accessToken", accessToken, httpOptions)
    .status(200)
    .json(new ApiResponse(200, { newAccessToken: accessToken }, "Access Token refreshed successfully"));

})
//CHANGE PASSWORD
const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "password and new password is required")
  }
  const user = await User.findById(req.user._id)
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Incorrect Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  res.status(200).json(new ApiResponse(200, "Password Changed Successfully"))
})
//SEND OTP
const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // 2. Generate OTP (4-digit)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const secretKey = process.env.SIMPLE_CRYPTO_SECRET_KEY
  const simpleCrypto = new SimpleCrypto(secretKey)
  const cipherText = simpleCrypto.encrypt(otp)
  // 3. Send OTP via email
  await sendEmail({
    to: user.email,
    name: user.name,
    otp
  });

  // 4. Create a user-specific token (cookie) to verify later
  const credentialsToken = jwt.sign(
    { userId: user._id, otpToken: cipherText },
    process.env.OTP_TOKEN_SECRET,
    { expiresIn: "10m" }
  );

  // Cookie expires in 10 minutes
  const otpCookieOptions = {
    ...httpOptions,
    maxAge: 10 * 60 * 1000
  };

  // 5. Send response
  res
    .cookie("credentialsToken", credentialsToken, otpCookieOptions)
    .status(200)
    .json(
      new ApiResponse(200, { credentialsToken }, "OTP sent successfully")
    );
});
//FORGOT/RESET PASSWORD
const resetPassword = asyncHandler(async (req, res) => {
  const { otp, newPassword } = req.body;
  if (!otp || !newPassword) {
    throw new ApiError(400, "OTP and New Password Required");
  }

  const credentialsToken =
    req.cookies?.credentialsToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!credentialsToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decoded;
  try {
    decoded = jwt.verify(credentialsToken, process.env.OTP_TOKEN_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "OTP Expired");
    }
    throw new ApiError(400, "Invalid or malformed token");
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Decrypt stored OTP
  const secretKey = process.env.SIMPLE_CRYPTO_SECRET_KEY;
  const simpleCrypto = new SimpleCrypto(secretKey);
  const originalOTP = simpleCrypto.decrypt(decoded.otpToken);

  const newOTP = otp.toString()
  if (newOTP != originalOTP) {
    throw new ApiError(401, "Incorrect OTP");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // Clear OTP cookie
  res.clearCookie("credentialsToken", httpOptions);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

//GET USER PROFILE
const getuserProfile = asyncHandler(async (req,res) => {
  const id = req.user._id;
  const result = await User.aggregate([
  {
    $match: { _id:id }
  },
  {
    $lookup: {
      from: "ads", 
      localField: "_id",
      foreignField: "sellerId",
      as: "user_ads"
    }
  },
  {
    $addFields: {
      totalAds: { $size: "$user_ads" },
      inActiveAds: {
        $size: {
          $filter: {
            input: "$user_ads",
            as: "ad",
            cond: { $eq: ["$$ad.isActive", false] }
          }
        }
      },
      activeAds: {
        $size: {
          $filter: {
            input: "$user_ads",
            as: "ad",
            cond: { $eq: ["$$ad.isActive", true] }
          }
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      name: 1,
      avatar: 1,
      email: 1,
      phone: 1,
      createdAt: 1,
      totalAds: 1,
      inActiveAds: 1,
      activeAds: 1
    }
  }
]);

res.status(200).json(new ApiResponse(200,result[0],"Profile Fetched Successfully"))

})
//UPDATE USER ACTIVE STATUS
// Update Last Seen
const updateLastSeen = asyncHandler(async (req, res) => {
  const userId = req.user._id; // comes from auth middleware (decoded token)

  const user = await User.findByIdAndUpdate(
    userId,
    { lastseen: new Date() },
    { new: true }
  ).select("-password");


  res.status(200).json(new ApiResponse(200,user.lastseen,"Last Seen Updated Successfully"));
});


export {
  registerUser,
  logInUser,
  uploadAvatar,
  updateProfile,
  logOutUser,
  refreshAccessToken,
  changeUserPassword,
  sendOTP,
  resetPassword,
  getuserProfile,
  updateLastSeen
}