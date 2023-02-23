import { configureStore } from "@reduxjs/toolkit";

import themeReducer from "./slices/themeSlice";

export default configureStore({
    reducer: themeReducer,
    devTools: true
});