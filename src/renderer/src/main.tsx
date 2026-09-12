import "./main.css";
import { Toaster } from "@renderer/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: false, refetchOnWindowFocus: false },
	},
});

const container = document.getElementById("root");
if (!container) {
	throw new Error("#root が見つかりません");
}

createRoot(container).render(
	<StrictMode>
		<ThemeProvider
			attribute="class"
			defaultTheme="lavender"
			enableSystem
			themes={["light", "dark", "lavender"]}
		>
			<QueryClientProvider client={queryClient}>
				<App />
				<Toaster />
			</QueryClientProvider>
		</ThemeProvider>
	</StrictMode>,
);
