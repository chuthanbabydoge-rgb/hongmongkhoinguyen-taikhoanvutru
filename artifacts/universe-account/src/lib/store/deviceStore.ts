const KEY = "universe_current_device_id";

export const deviceStore = {
  getCurrentDeviceId(): string | null {
    return localStorage.getItem(KEY);
  },
  setCurrentDeviceId(id: string) {
    localStorage.setItem(KEY, id);
  },
  clear() {
    localStorage.removeItem(KEY);
  }
};
