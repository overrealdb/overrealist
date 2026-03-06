import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { OverrealErrorBoundary } from "~/components/OverrealErrorBoundary";

beforeAll(() => {
	// MantineProvider needs matchMedia in jsdom
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
});

function wrap(ui: JSX.Element) {
	return <MantineProvider>{ui}</MantineProvider>;
}

function Boom(): JSX.Element {
	throw new Error("Kaboom!");
}

function Safe(): JSX.Element {
	return <div>Safe content</div>;
}

describe("OverrealErrorBoundary", () => {
	it("renders children when no error", () => {
		render(
			wrap(
				<OverrealErrorBoundary>
					<Safe />
				</OverrealErrorBoundary>,
			),
		);
		expect(screen.getByText("Safe content")).toBeInTheDocument();
	});

	it("catches error and shows fallback", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(
			wrap(
				<OverrealErrorBoundary fallbackTitle="Test error">
					<Boom />
				</OverrealErrorBoundary>,
			),
		);

		expect(screen.getByText("Test error")).toBeInTheDocument();
		expect(screen.getByText("Kaboom!")).toBeInTheDocument();
		expect(screen.getByText("Try again")).toBeInTheDocument();

		spy.mockRestore();
	});

	it("recovers after clicking Try again", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		let shouldThrow = true;

		function MaybeThrow() {
			if (shouldThrow) throw new Error("First render");
			return <div>Recovered</div>;
		}

		const { rerender } = render(
			wrap(
				<OverrealErrorBoundary>
					<MaybeThrow />
				</OverrealErrorBoundary>,
			),
		);

		expect(screen.getByText("Try again")).toBeInTheDocument();

		shouldThrow = false;
		fireEvent.click(screen.getByText("Try again"));

		rerender(
			wrap(
				<OverrealErrorBoundary>
					<MaybeThrow />
				</OverrealErrorBoundary>,
			),
		);

		expect(screen.getByText("Recovered")).toBeInTheDocument();

		spy.mockRestore();
	});
});
