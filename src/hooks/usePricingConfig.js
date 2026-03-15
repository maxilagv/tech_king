import { useConfigDoc } from "@/hooks/useConfigDoc";
import { normalizePricingConfig } from "@/utils/pricingEngine";

export function usePricingConfig() {
  const { data, loading, error } = useConfigDoc("pricing", {
    normalize: normalizePricingConfig,
    fallback: {},
  });

  return {
    pricingConfig: data,
    loading,
    error,
  };
}
