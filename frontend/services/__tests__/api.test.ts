jest.mock("../supabase", () => ({
  supabase: {
    auth: { getSession: jest.fn() },
  },
}));

import { supabase } from "../supabase";
import { generateRoute, FilterParams } from "../api";

const mockedGetSession = supabase.auth.getSession as jest.Mock;

const baseParams: FilterParams = {
  lat: 1.3,
  lng: 103.8,
  budget: 2,
  walking: 5,
  mode: "balanced",
  food_vibes: ["Coffee", "Fuel Stop"],
  activity_vibes: ["Culture"],
  num_food: 2,
  num_activities: 1,
};

function okResponse(body: any) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) };
}

beforeEach(() => {
  mockedGetSession.mockResolvedValue({ data: { session: null } });
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("generateRoute", () => {
  it("builds a URL with scalar params and repeated-key array params", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(okResponse({ stops: [], mode: "balanced" }));

    await generateRoute(baseParams);

    const calledUrl = new URL((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(calledUrl.searchParams.get("lat")).toBe("1.3");
    expect(calledUrl.searchParams.get("lng")).toBe("103.8");
    expect(calledUrl.searchParams.get("budget")).toBe("2");
    expect(calledUrl.searchParams.get("walking")).toBe("5");
    expect(calledUrl.searchParams.get("mode")).toBe("balanced");
    expect(calledUrl.searchParams.get("num_food")).toBe("2");
    expect(calledUrl.searchParams.get("num_activities")).toBe("1");
    expect(calledUrl.searchParams.getAll("food_vibes")).toEqual(["Coffee", "Fuel Stop"]);
    expect(calledUrl.searchParams.getAll("activity_vibes")).toEqual(["Culture"]);
  });

  it("includes a Bearer token header when a session is present", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: { access_token: "tok123" } } });
    (global.fetch as jest.Mock).mockResolvedValue(okResponse({ stops: [], mode: "balanced" }));

    await generateRoute(baseParams);

    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers.Authorization).toBe("Bearer tok123");
  });

  it("omits the Authorization header when there is no session", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: null } });
    (global.fetch as jest.Mock).mockResolvedValue(okResponse({ stops: [], mode: "balanced" }));

    await generateRoute(baseParams);

    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("returns parsed JSON on a successful response", async () => {
    const body = { stops: [{ name: "Stop 1" }], mode: "balanced" };
    (global.fetch as jest.Mock).mockResolvedValue(okResponse(body));

    await expect(generateRoute(baseParams)).resolves.toEqual(body);
  });

  it("throws the detail message when a non-ok response has a parseable body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: "Server exploded" }),
    });

    await expect(generateRoute(baseParams)).rejects.toThrow("Server exploded");
  });

  it("throws a generic status message when a non-ok response body is unparseable", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("bad json")),
    });

    await expect(generateRoute(baseParams)).rejects.toThrow("Backend error: 500");
  });

  it("logs and rethrows an AbortError", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    (global.fetch as jest.Mock).mockRejectedValue(abortError);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(generateRoute(baseParams)).rejects.toBe(abortError);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("clears the timeout in both the success and error paths", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    (global.fetch as jest.Mock).mockResolvedValueOnce(okResponse({ stops: [], mode: "balanced" }));
    await generateRoute(baseParams);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

    clearTimeoutSpy.mockClear();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network down"));
    await expect(generateRoute(baseParams)).rejects.toThrow("network down");
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

    clearTimeoutSpy.mockRestore();
  });
});
