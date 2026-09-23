declare module '@react-native-async-storage/async-storage' {
  type StorageValue = string | null;

  interface AsyncStorageStatic {
    getItem(key: string): Promise<StorageValue>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }

  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}
