import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type ProcessingTime = {
  visa_type: string;
  visa_label: string;
  country_code: string;
  country_name: string;
  processing_weeks: number;
  unit: string;
  fetched_at: string;
};
