// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store";

// src/index.tsx
declare global {
  interface Window {
    Kakao: any;
  }
}

const kakaoAppKey = "YOUR_APP_KEY";

if (window.Kakao) {
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(kakaoAppKey);
  }
}

createRoot(document.getElementById("root")!).render(
  //   <StrictMode>
  <BrowserRouter>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </BrowserRouter>
  //   </StrictMode>
);
