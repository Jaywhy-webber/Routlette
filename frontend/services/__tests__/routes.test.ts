import { createSupabaseQueryBuilderMock } from "../testUtils/supabaseMock";

jest.mock("../supabase", () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    from: jest.fn(),
  },
}));

import { supabase } from "../supabase";
import { saveRoute, getSavedRoutes, deleteRoute } from "../routes";

const mockedFrom = supabase.from as jest.Mock;
const mockedGetSession = supabase.auth.getSession as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

const sampleInput = {
  label: "My Route",
  stops: [],
  mode: "balanced",
  journey_start_time: 1000,
  journey_end_time: 2000,
  total_distance: 500,
};

describe("saveRoute", () => {
  it("throws 'Not authenticated' when there is no session and never queries the table", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: null } });
    await expect(saveRoute(sampleInput)).rejects.toThrow("Not authenticated");
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("inserts with the session's user_id and returns the saved row on success", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    const savedRow = { id: "r1", ...sampleInput, user_id: "u1" };
    const builder = createSupabaseQueryBuilderMock({ data: savedRow, error: null });
    mockedFrom.mockReturnValue(builder);

    const result = await saveRoute(sampleInput);

    expect(mockedFrom).toHaveBeenCalledWith("saved_routes");
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u1", ...sampleInput }));
    expect(result).toEqual(savedRow);
  });

  it("propagates an insert error", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    const error = new Error("db error");
    const builder = createSupabaseQueryBuilderMock({ data: null, error });
    mockedFrom.mockReturnValue(builder);

    await expect(saveRoute(sampleInput)).rejects.toBe(error);
  });
});

describe("getSavedRoutes", () => {
  it("returns data ordered by saved_at desc", async () => {
    const rows = [{ id: "r1" }, { id: "r2" }];
    const builder = createSupabaseQueryBuilderMock({ data: rows, error: null });
    mockedFrom.mockReturnValue(builder);

    const result = await getSavedRoutes();

    expect(builder.select).toHaveBeenCalledWith("*");
    expect(builder.order).toHaveBeenCalledWith("saved_at", { ascending: false });
    expect(result).toEqual(rows);
  });

  it("returns an empty array when data is null", async () => {
    const builder = createSupabaseQueryBuilderMock({ data: null, error: null });
    mockedFrom.mockReturnValue(builder);

    await expect(getSavedRoutes()).resolves.toEqual([]);
  });

  it("propagates an error", async () => {
    const error = new Error("db error");
    const builder = createSupabaseQueryBuilderMock({ data: null, error });
    mockedFrom.mockReturnValue(builder);

    await expect(getSavedRoutes()).rejects.toBe(error);
  });
});

describe("deleteRoute", () => {
  it("calls delete().eq('id', ...) and resolves without throwing on success", async () => {
    const builder = createSupabaseQueryBuilderMock({ data: null, error: null });
    mockedFrom.mockReturnValue(builder);

    await expect(deleteRoute("r1")).resolves.toBeUndefined();

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "r1");
  });

  it("propagates an error", async () => {
    const error = new Error("db error");
    const builder = createSupabaseQueryBuilderMock({ data: null, error });
    mockedFrom.mockReturnValue(builder);

    await expect(deleteRoute("r1")).rejects.toBe(error);
  });
});
