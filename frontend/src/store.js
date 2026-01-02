import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./slices/apiSlice.js";
import authSliceReducer from "./slices/authSlice.js";
import { mocaSelfApiSlice } from "./slices/mocaSelfApiSlice";
import { moodApi } from "./slices/moodApiSlice"; // Importación del moodApiSlice

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authSliceReducer,
    [mocaSelfApiSlice.reducerPath]: mocaSelfApiSlice.reducer,
    [moodApi.reducerPath]: moodApi.reducer, // Agregado para manejar estados de ánimo
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(mocaSelfApiSlice.middleware)
      .concat(moodApi.middleware), // Agregado para manejar middleware de moods
  devTools: true, // Habilitar DevTools
});

export default store;
