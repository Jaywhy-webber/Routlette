import { createSupabaseQueryBuilderMock } from "../testUtils/supabaseMock";

jest.mock("../supabase", () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    from: jest.fn(),
  },
}));

import { supabase } from "../supabase";
import { distinctNeighbourhoods, recordRouteCompletion, getDiscoveredAreaSummaries } from "../discoveries";
import { Stop } from "../api";

const mockedFrom = supabase.from as jest.Mock;
const mockedGetSession = supabase.auth.getSession as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

const stop = (overrides: Partial<Stop> = {}): Stop => ({
  name: "Venue",
  category: "food",
  vibe: "Coffee",
  address: "Addr",
  lat: 1.3,
  lng: 103.8,
  price_level: 2,
  score: 0.5,
  clue: "clue",
  ...overrides,
});

describe("distinctNeighbourhoods", () => {
  it("dedups repeated neighbourhood names across stops", () => {
    const stops = [stop({ neighbourhood: "Bishan" }), stop({ neighbourhood: "Bishan" })];
    expect(distinctNeighbourhoods(stops)).toEqual(["Bishan"]);
  });

  it("drops null, undefined, and missing neighbourhood values", () => {
    const stops = [
      stop({ neighbourhood: "Bishan" }),
      stop({ neighbourhood: null }),
      stop({ neighbourhood: undefined }),
      stop(),
    ];
    expect(distinctNeighbourhoods(stops)).toEqual(["Bishan"]);
  });

  it("returns an empty array when no stop has a neighbourhood", () => {
    expect(distinctNeighbourhoods([stop({ neighbourhood: null })])).toEqual([]);
  });
});

describe("recordRouteCompletion", () => {
  it("no-ops without querying the table when there is no session", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: null } });

    await recordRouteCompletion([stop({ neighbourhood: "Bishan" })], 1000, 2000);

    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("no-ops when the route has no resolvable neighbourhoods", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });

    await recordRouteCompletion([stop({ neighbourhood: null })], 1000, 2000);

    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("upserts one row per distinct neighbourhood with the session's user_id and a derived route_token", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    const builder = createSupabaseQueryBuilderMock({ data: null, error: null });
    mockedFrom.mockReturnValue(builder);

    const stops = [stop({ neighbourhood: "Bishan" }), stop({ neighbourhood: "Toa Payoh" })];
    await recordRouteCompletion(stops, 1000, 2000);

    expect(mockedFrom).toHaveBeenCalledWith("route_completions");
    expect(builder.upsert).toHaveBeenCalledWith(
      [
        { user_id: "u1", planning_area: "Bishan", route_token: "1000-2000" },
        { user_id: "u1", planning_area: "Toa Payoh", route_token: "1000-2000" },
      ],
      { onConflict: "user_id,planning_area,route_token", ignoreDuplicates: true }
    );
  });

  it("propagates an upsert error", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    const error = new Error("db error");
    const builder = createSupabaseQueryBuilderMock({ data: null, error });
    mockedFrom.mockReturnValue(builder);

    await expect(
      recordRouteCompletion([stop({ neighbourhood: "Bishan" })], 1000, 2000)
    ).rejects.toBe(error);
  });
});

describe("getDiscoveredAreaSummaries", () => {
  it("aggregates rows into per-area counts", async () => {
    const rows = [
      { planning_area: "Bishan", completed_at: "2026-01-01T00:00:00Z" },
      { planning_area: "Bishan", completed_at: "2026-01-02T00:00:00Z" },
      { planning_area: "Toa Payoh", completed_at: "2026-01-03T00:00:00Z" },
    ];
    const builder = createSupabaseQueryBuilderMock({ data: rows, error: null });
    mockedFrom.mockReturnValue(builder);

    const result = await getDiscoveredAreaSummaries();

    expect(result.Bishan.count).toBe(2);
    expect(result["Toa Payoh"].count).toBe(1);
  });

  it("keeps the later completed_at as lastExploredAt regardless of row order", async () => {
    const rowsEarlierFirst = [
      { planning_area: "Bishan", completed_at: "2026-01-01T00:00:00Z" },
      { planning_area: "Bishan", completed_at: "2026-01-05T00:00:00Z" },
    ];
    const builder1 = createSupabaseQueryBuilderMock({ data: rowsEarlierFirst, error: null });
    mockedFrom.mockReturnValue(builder1);
    expect((await getDiscoveredAreaSummaries()).Bishan.lastExploredAt).toBe("2026-01-05T00:00:00Z");

    const rowsLaterFirst = [
      { planning_area: "Bishan", completed_at: "2026-01-05T00:00:00Z" },
      { planning_area: "Bishan", completed_at: "2026-01-01T00:00:00Z" },
    ];
    const builder2 = createSupabaseQueryBuilderMock({ data: rowsLaterFirst, error: null });
    mockedFrom.mockReturnValue(builder2);
    expect((await getDiscoveredAreaSummaries()).Bishan.lastExploredAt).toBe("2026-01-05T00:00:00Z");
  });

  it("returns an empty object when data is null", async () => {
    const builder = createSupabaseQueryBuilderMock({ data: null, error: null });
    mockedFrom.mockReturnValue(builder);

    await expect(getDiscoveredAreaSummaries()).resolves.toEqual({});
  });

  it("propagates an error", async () => {
    const error = new Error("db error");
    const builder = createSupabaseQueryBuilderMock({ data: null, error });
    mockedFrom.mockReturnValue(builder);

    await expect(getDiscoveredAreaSummaries()).rejects.toBe(error);
  });
});
