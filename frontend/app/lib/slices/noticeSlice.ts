import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
  duration?: number; // Auto-dismiss after this many milliseconds
  persistent?: boolean; // Don't auto-dismiss
}

interface NoticeState {
  notices: Notice[];
}

const initialState: NoticeState = {
  notices: [],
};

const noticeSlice = createSlice({
  name: 'notice',
  initialState,
  reducers: {
    addNotice: (state, action: PayloadAction<Omit<Notice, 'id' | 'timestamp'>>) => {
      const notice: Notice = {
        ...action.payload,
        id: `notice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        duration: action.payload.duration || 5000, // Default 5 seconds
      };
      state.notices.push(notice);
    },
    removeNotice: (state, action: PayloadAction<string>) => {
      state.notices = state.notices.filter(notice => notice.id !== action.payload);
    },
    clearAllNotices: (state) => {
      state.notices = [];
    },
    updateNotice: (state, action: PayloadAction<{ id: string; updates: Partial<Notice> }>) => {
      const { id, updates } = action.payload;
      const index = state.notices.findIndex(notice => notice.id === id);
      if (index !== -1) {
        state.notices[index] = { ...state.notices[index], ...updates };
      }
    },
  },
});

export const { addNotice, removeNotice, clearAllNotices, updateNotice } = noticeSlice.actions;

// Selectors
export const selectNotices = (state: { notice: NoticeState }) => state.notice.notices;
export const selectNoticeById = (state: { notice: NoticeState }, id: string) => 
  state.notice.notices.find(notice => notice.id === id);
export const selectNoticesByType = (state: { notice: NoticeState }, type: Notice['type']) => 
  state.notice.notices.filter(notice => notice.type === type);

export default noticeSlice.reducer;
