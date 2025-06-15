import { render } from "@testing-library/react";
import { expect, test } from "vitest";

import StudyTracker from "@/app/tracker/page";

test("TrackerPage matches snapshot", () => {
    const { container } = render(<StudyTracker />);
    expect(container).toMatchSnapshot();
});


