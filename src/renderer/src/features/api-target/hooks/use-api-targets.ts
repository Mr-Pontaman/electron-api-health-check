import { useQuery } from "@tanstack/react-query";
import { apiTargetsQueryKey } from "../query-keys";

export const useApiTargets = () =>
	useQuery({
		queryKey: apiTargetsQueryKey,
		queryFn: () => window.api.getApiTargets(),
	});
