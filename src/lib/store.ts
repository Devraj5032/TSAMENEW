import { configureStore } from '@reduxjs/toolkit';
import userSlice from './features/user/userSlice';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

// Define the persist configuration
const persistConfig = {
  key: 'root', // the key in localStorage
  storage,     // default storage is localStorage
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, userSlice);

export const makeStore = () => {
  return configureStore({
    reducer: {
      user: persistedReducer, // Wrap userSlice with persistReducer
    },
  });
};

const store = makeStore();

export const persistor = persistStore(store); // Create a persistor

export default store;

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
