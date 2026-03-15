import { useConfigDoc } from "@/hooks/useConfigDoc";
import { getFallbackBusinessConfig, normalizeBusinessConfig } from "@/utils/businessConfig";

export function useBusinessConfig() {
  const { data, loading, error } = useConfigDoc("business", {
    normalize: normalizeBusinessConfig,
    fallback: getFallbackBusinessConfig(),
  });

  return {
    businessConfig: data,
    loading,
    error,
  };
}
