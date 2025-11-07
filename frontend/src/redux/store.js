import { configureStore } from '@reduxjs/toolkit';
import guestHousesReducer from './guestHouseSlice';

export const store = configureStore({
  reducer: {
    guestHouses: guestHousesReducer,
  },
});
