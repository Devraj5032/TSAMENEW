import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie'; // Import js-cookie

interface UserState {
  id: number;
  user_name: string;
  role: string;
}

const initialState: UserState = {
  id: 0,
  user_name: "",
  role: ""
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      state.id = action.payload.id;
      state.user_name = action.payload.user_name;
      state.role = action.payload.role;
    },
    logout(state) {
      state.id = 0;
      state.user_name = "";
      state.role = "";

      // Clear the user cookie on logout
      Cookies.remove('user');
    }
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
