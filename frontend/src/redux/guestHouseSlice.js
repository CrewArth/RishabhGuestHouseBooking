import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Adjust base URL if you use a proxy; this is explicit
const API_BASE = 'http://localhost:5000';

export const fetchGuestHouses = createAsyncThunk(
  'guestHouses/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE}/api/guesthouses`);
      // Your API returns either an array or {guestHouses:[...]} — normalize it:
      const data = Array.isArray(res.data) ? res.data : (res.data.guestHouses || []);
      return data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.error || err?.message || 'Failed to fetch guest houses'
      );
    }
  }
);

const guestHouseSlice = createSlice({
  name: 'guestHouses',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {
    // keep for future (e.g., local add/update/remove without refetch)
    resetGuestHouses(state) {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuestHouses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuestHouses.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload || [];
      })
      .addCase(fetchGuestHouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error loading guest houses';
      });
  },
});

export const { resetGuestHouses } = guestHouseSlice.actions;
export default guestHouseSlice.reducer;
