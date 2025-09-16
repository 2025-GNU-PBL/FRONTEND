import { createSlice } from "@reduxjs/toolkit";
import { registerUser } from "./thunkFunctions";
import { toast } from "react-toastify";

const initialState = {
  userData: {
    id: "",
    email: "",
    name: "",
    role: 0,
    image: "",
  },
  isAuth: false,
  isLoading: false,
  error: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(registerUser.fulfilled, (state) => {
      state.isLoading = false;
      toast.info("회원가입을 성공했습니다.");
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      // Check if action.payload exists and is a string
      const errorMessage = typeof action.payload === 'string'
        ? action.payload
        : 'An unknown error occurred';
      
      state.error = errorMessage;
      toast.error(errorMessage);
    });
  },
});

export default userSlice.reducer;