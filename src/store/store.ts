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

const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  signup: persistReducer(signupPersistConfig, signupReducer),
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "signup"],
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
