import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Profile } from '../models/Profile.model.js';

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating refresh and access token',
    );
  }
};

//** REGISTER */

const register = async (req, res) => {
  const { fullName, email, password, profession } = req.body;
  console.log('reg:', req.body);

  if (
    [fullName, email, password, profession].some(
      (field) => field?.trim() === '',
    )
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(400, 'User with email or already exist');
  }

  const user = await User.create({
    fullName,
    email,
    password,
    profession,
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken',
  );

  console.log('createdUser:', createdUser);

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registring the user');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, 'User Registered!'));
};

//** LOGIN */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, 'email is required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, 'User does not exist');
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid user credentials!');
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const logedInUser = await User.findById(user._id).select(
    '-password -refreshToken',
  );

  // console.log("acc:",accessToken);
  // console.log("ref:",refreshToken);
  // console.log("liu:",logedInUser)

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: logedInUser,
          accessToken,
          refreshToken,
        },
        'User logged in successfully!',
      ),
    );
};

//** LOGOUT */
const logout = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, 'User not authenticated'));
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { refreshToken: null } },
      { new: true },
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };

    return res
      .clearCookie('accessToken', options)
      .clearCookie('refreshToken', options)
      .status(200)
      .json(new ApiResponse(200, {}, 'User logged out successfully'));
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json(new ApiResponse(500, {}, 'Server error'));
  }
};

//** Update Profile Controller */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Extract `profileData` from the request body
    const { profileData } = req.body;

    if (!profileData) {
      throw new ApiError(400, 'No profile data provided for update');
    }
    console.log("Jobinfo:",profileData.jobInfo);

    const { personalInfo, academicInfo, jobInfo, extraActivities, aboutSection, futurePlans } = profileData;

    // Validate that at least one section is present for update
    if (
      !personalInfo &&
      !academicInfo &&
      !jobInfo &&
      !extraActivities &&
      !aboutSection &&
      !futurePlans
    ) {
      throw new ApiError(400, 'No fields provided for update');
    }

    // Prepare data for update in `Profile` model
    const profileUpdateData = {
      fullName: personalInfo?.name,
      address: personalInfo?.address,
      contact: personalInfo?.contact,
      linkedInProfile: personalInfo?.linkedin,
      githubProfile: personalInfo?.github,
      ugCollege: academicInfo?.collegeUg,
      ugYearOfPassing: academicInfo?.yearOfPassingUG,
      pgCollege: academicInfo?.collegePg,
      pgYearOfPassing: academicInfo?.yearOfPassingPG,
      currentCompany: jobInfo?.currentCompany,
      jobRole: jobInfo?.jobRole,
      skills: jobInfo?.skills?.split(','),
      workExperience: jobInfo?.workExperience,
      exCompany: jobInfo?.exCompany,
      extraActivities,
      about: aboutSection,
      futurePlans,
    };

    // Filter out undefined values from `profileUpdateData`
    Object.keys(profileUpdateData).forEach(
      (key) => profileUpdateData[key] === undefined && delete profileUpdateData[key]
    );

    // Find the existing profile
    let updatedProfile = await Profile.findOne({ userId });

    // If no profile exists, create a new one
    if (!updatedProfile) {
      updatedProfile = new Profile({
        userId,
        profession: req.user.profession, // Set profession from User model or pass from req.body
        ...profileUpdateData, // Merge profile data into the new profile
      });

      // Save the newly created profile
      await updatedProfile.save();
    } else {
      // If profile exists, update it
      updatedProfile = await Profile.findOneAndUpdate(
        { userId },
        profileUpdateData,
        { new: true, runValidators: true }
      );
    }

    // Return success response
    return res.status(200).json(new ApiResponse(200, updatedProfile, 'Profile updated successfully!'));
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json(new ApiResponse(500, {}, 'Failed to update profile'));
  }
};

//** FETCH  PROFILE BY ID */
const fetchProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch profile data from the Profile model
    const profile = await Profile.findOne({ userId }).populate('userId', 'fullName email profession');

    if (!profile) {
      throw new ApiError(404, 'Profile not found for the user');
    }

    // Return the profile data
    return res.status(200).json(new ApiResponse(200, profile, 'Profile fetched successfully'));
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json(new ApiResponse(500, {}, 'Failed to fetch profile data'));
  }
};

export { register, login, logout, updateProfile,fetchProfile };
