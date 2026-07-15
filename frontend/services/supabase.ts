import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore is encrypted at rest; fall back to AsyncStorage when the value
// exceeds SecureStore's ~2 KB per-item limit (e.g. large tokens).
const SecureStoreAdapter = {
  getItem: (key: string) =>
    SecureStore.getItemAsync(key).catch(() => AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value).catch(() => AsyncStorage.setItem(key, value)),
  removeItem: (key: string) =>
    SecureStore.deleteItemAsync(key).catch(() => AsyncStorage.removeItem(key)),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
