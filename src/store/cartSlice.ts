// src/store/cartSlice.ts
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../lib/api/axios";

export interface CartState {
  count: number;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  count: 0,
  loading: false,
  error: null,
};

// 장바구니 개수 서버에서 다시 가져오기
export const fetchCartCount = createAsyncThunk<number, void>(
  "cart/fetchCartCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<number>("/api/v1/cart/count");
      return res.data;
    } catch (error) {
      console.error("fetchCartCount 실패:", error);
      return rejectWithValue("장바구니 수량을 불러오지 못했습니다.");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // 필요하면 직접 세팅할 수 있는 액션도 만들어둠
    setCartCount(state, action: PayloadAction<number>) {
      state.count = action.payload;
    },
    increaseCartCount(state, action: PayloadAction<number>) {
      state.count += action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartCount.fulfilled, (state, action) => {
        state.loading = false;
        state.count = action.payload;
      })
      .addCase(fetchCartCount.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string | null) ??
          "장바구니 정보를 불러오지 못했습니다.";
      });
  },
});

export const { setCartCount, increaseCartCount } = cartSlice.actions;
export default cartSlice.reducer;
