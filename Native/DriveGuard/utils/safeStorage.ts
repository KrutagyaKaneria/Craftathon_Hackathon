import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Fallback in-memory storage for when AsyncStorage native module is null
 * Handles "AsyncStorageError: Native module is null, cannot access legacy storage"
 */
const memoryStorage: Record<string, string> = {};

/**
 * SafeAsyncStorage - Wrapper for AsyncStorage with proper error handling
 * Includes fallback to in-memory storage when native module fails
 */
export const safeStorage = {
  /**
   * Get item from storage - handles errors gracefully with fallback
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error: any) {
      console.warn(`SafeStorage: AsyncStorage failed, using memory fallback for "${key}"`);
      // Fallback to memory storage
      return memoryStorage[key] || null;
    }
  },

  /**
   * Set item in storage - handles errors gracefully with fallback
   */
  setItem: async (key: string, value: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, value);
      // Also store in memory as backup
      memoryStorage[key] = value;
      return true;
    } catch (error: any) {
      console.warn(`SafeStorage: AsyncStorage failed, using memory fallback for "${key}"`);
      // Fallback to memory storage
      memoryStorage[key] = value;
      return true; // Return true since we stored it in memory
    }
  },

  /**
   * Remove item from storage - handles errors gracefully with fallback
   */
  removeItem: async (key: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      // Also remove from memory
      delete memoryStorage[key];
      return true;
    } catch (error: any) {
      console.warn(`SafeStorage: AsyncStorage failed, using memory fallback for removal "${key}"`);
      // Fallback to memory storage
      delete memoryStorage[key];
      return true;
    }
  },

  /**
   * Clear all storage - handles errors gracefully with fallback
   */
  clear: async (): Promise<boolean> => {
    try {
      await AsyncStorage.clear();
      // Also clear memory
      Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
      return true;
    } catch (error: any) {
      console.warn('SafeStorage: AsyncStorage clear failed, clearing memory fallback');
      // Fallback to memory storage
      Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
      return true;
    }
  },

  /**
   * Get all keys - handles errors gracefully with fallback
   */
  getAllKeys: async (): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error: any) {
      console.warn('SafeStorage: AsyncStorage getAllKeys failed, using memory fallback');
      // Fallback to memory storage
      return Object.keys(memoryStorage);
    }
  },
};

export default safeStorage;
