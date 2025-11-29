import { combineReducers, configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage"; // localStorage
import storageSession from "redux-persist/lib/storage/session"; // sessionStorage
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import userReducer from "./userSlice";
import signupReducer from "./signupSlice";
import chatReducer from "./chatSlice";
import cartReducer from "./cartSlice";

const userPersistConfig = {
  key: "user",
  storage,
  whitelist: ["userData", "isAuth"],
};

const signupPersistConfig = {
  key: "signup",
  storage: storageSession,
  whitelist: ["values"],
};

const chatPersistConfig = {
  key: "chat",
  storage,
  whitelist: ["rooms"], // 채팅방 목록만 저장 (메시지는 API에서 새로 가져옴)
};

const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  signup: persistReducer(signupPersistConfig, signupReducer),
  chat: persistReducer(chatPersistConfig, chatReducer), // 채팅방 목록 persist
  cart: cartReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "signup", "chat"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.MODE !== "production",
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
