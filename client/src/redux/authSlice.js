import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    requiresOtp: false,
    demoOtp: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      localStorage.removeItem('eps_access');
      localStorage.removeItem('eps_refresh');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const ok = (state, action) => {
      state.loading = false;
      state.error = null;
      if (action.payload.requiresOtp) {
        state.requiresOtp = true;
        state.demoOtp = action.payload.demoOtp;
        return;
      }
      state.requiresOtp = false;
      state.user = action.payload.user;
      if (action.payload.accessToken) localStorage.setItem('eps_access', action.payload.accessToken);
      if (action.payload.refreshToken) localStorage.setItem('eps_refresh', action.payload.refreshToken);
    };
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, ok)
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, ok)
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMe.pending, (state) => { state.loading = true; })
      .addCase(fetchMe.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
        localStorage.removeItem('eps_access');
        localStorage.removeItem('eps_refresh');
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
