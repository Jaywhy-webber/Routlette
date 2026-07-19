import { formatDuration, formatDistance, formatSavedAt } from "../format";

describe("formatDuration", () => {
  it("returns 0s for zero milliseconds", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  it("returns seconds only when under a minute", () => {
    expect(formatDuration(45000)).toBe("45s");
  });

  it("returns 1m 0s exactly at the 60000ms boundary", () => {
    expect(formatDuration(60000)).toBe("1m 0s");
  });

  it("returns minutes and seconds combined", () => {
    expect(formatDuration(125000)).toBe("2m 5s");
  });

  it("returns 1h 0m exactly at the one-hour boundary", () => {
    expect(formatDuration(3600000)).toBe("1h 0m");
  });

  it("drops seconds once hours are present", () => {
    expect(formatDuration(3725000)).toBe("1h 2m");
  });
});

describe("formatDistance", () => {
  it("rounds to the nearest metre under 1000m", () => {
    expect(formatDistance(499.6)).toBe("500 m");
  });

  it("switches to km exactly at the 1000m boundary", () => {
    expect(formatDistance(1000)).toBe("1.00 km");
  });

  it("formats larger distances as km with two decimals", () => {
    expect(formatDistance(2534)).toBe("2.53 km");
  });
});

describe("formatSavedAt", () => {
  it("returns a non-empty formatted string", () => {
    expect(formatSavedAt("2026-03-15T00:00:00Z").length).toBeGreaterThan(0);
  });

  it("contains the correct year for a known ISO input", () => {
    expect(formatSavedAt("2026-03-15T00:00:00Z")).toContain("2026");
  });

  it("produces different output for different ISO inputs", () => {
    const a = formatSavedAt("2026-01-01T00:00:00Z");
    const b = formatSavedAt("2027-06-15T00:00:00Z");
    expect(a).not.toBe(b);
  });
});
