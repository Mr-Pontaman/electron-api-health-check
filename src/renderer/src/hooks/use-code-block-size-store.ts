import { create } from "zustand";
import { persist } from "zustand/middleware";

type CodeBlockState = {
	height: number;
	setHeight: (height: number) => void;
};

export const useCodeBlockStore = create<CodeBlockState>()(
	persist(
		(set) => ({
			height: 200, // 初期高さ (px)
			setHeight: (height) =>
				set({ height: Math.max(100, Math.min(800, height)) }), // 100px〜800pxの範囲制限
		}),
		{
			name: "response-body-height-storage",
		},
	),
);
