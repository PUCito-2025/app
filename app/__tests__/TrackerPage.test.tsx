import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import StudyTracker from "@/app/tracker/page";

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

// Mock fetch for API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        courses: [],
        studyPlans: [],
      }),
  }),
) as unknown as typeof fetch;

test("TrackerPage matches snapshot", () => {
  const { container } = render(<StudyTracker />);
  expect(container).toMatchSnapshot();
});
