import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rdnfujnwqsliwtockhvx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yL_QNzc7y_YCuMHEYEX8qQ_gGIdP4QQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

export type ProcessingTime = {
  visa_type: string;
  visa_label: string;
  country_code: string;
  country_name: string;
  processing_weeks: number;
  unit: string;
  fetched_at: string;
};
