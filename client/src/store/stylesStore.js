import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';
import { styleColors } from '../constants/styleConstants';

const useStylesStore = create((set, get) => ({
  styles: [],
  loaded: false,

  fetchStyles: async () => {
    if (get().loaded) return;
    try {
      const res = await axiosInstance.get('/users/styles/list');
      set({ styles: res.data, loaded: true });
    } catch {}
  },

  // DB의 label 반환 (없으면 value 그대로)
  getLabel: (value) =>
    get().styles.find(s => s.value === value)?.label || value,

  // 공유 상수의 color 반환
  getColor: (value) => styleColors[value] || '#A0A0A0',

  // 전체 style 객체 반환
  getStyle: (value) => get().styles.find(s => s.value === value),
}));

export default useStylesStore;
