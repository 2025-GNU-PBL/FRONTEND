import { createAsyncThunk } from "@reduxjs/toolkit";
import axios, { isAxiosError } from "axios"; // Note: isAxiosError is a helper function from axios

type RegisterBody = {
    name: string;
    email: string;
    password: string;
    role: number;
  };

export const registerUser = createAsyncThunk(
    "user/registerUser",
    async (body: RegisterBody, thunkAPI) => {
        try {
            const response = await axios.post("/users/register", body);
            return response.data;
        } catch (error) {
            // Check if the error is an AxiosError
            if (isAxiosError(error)) {
                // Now TypeScript knows 'error' is of type AxiosError
                console.log(error);
                return thunkAPI.rejectWithValue(error.response?.data || error.message);
            } else {
                // Handle other types of errors
                console.log(error);
                return thunkAPI.rejectWithValue('An unexpected error occurred');
            }
        }
    }
);