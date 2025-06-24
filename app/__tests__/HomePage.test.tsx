import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import HomePage from "@/app/page";

// Mock the useUser hook from Clerk
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      id: "test-user-id",
      fullName: "Test User",
    },
    isLoaded: true,
  }),
}));

// Mock fetch for API calls (notification panel)
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        count: 0,
        notifications: [],
      }),
  }),
) as unknown as typeof fetch;

test("HomePage matches snapshot", () => {
  const { container } = render(<HomePage />);
  expect(container).toMatchSnapshot();
});
