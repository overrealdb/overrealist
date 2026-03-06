import { Box, Button, Stack, Text } from "@mantine/core";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallbackTitle?: string;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class OverrealErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("[OverrealErrorBoundary]", error, info.componentStack);
	}

	render() {
		if (this.state.hasError) {
			return (
				<Box
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						padding: 24,
					}}
				>
					<Stack align="center" gap="sm">
						<Text fw={600} size="lg">
							{this.props.fallbackTitle ?? "Something went wrong"}
						</Text>
						<Text size="sm" c="dimmed" ta="center" maw={400}>
							{this.state.error?.message ?? "An unexpected error occurred in this view."}
						</Text>
						<Button
							variant="light"
							size="sm"
							onClick={() => this.setState({ hasError: false, error: null })}
						>
							Try again
						</Button>
					</Stack>
				</Box>
			);
		}

		return this.props.children;
	}
}
