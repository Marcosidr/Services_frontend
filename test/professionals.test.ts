import { describe, expect, it } from "vitest";
import {
  normalizeCategory,
  normalizeProfessional
} from "../src/app/utils/professionals";

describe("professionals utils", () => {
  it("normalizes category payload", () => {
    const normalized = normalizeCategory({
      id: 10,
      label: "  Eletricista  ",
      slug: "ELETRICISTA",
      is_active: true
    });

    expect(normalized).toEqual({
      id: "10",
      label: "Eletricista",
      slug: "ELETRICISTA",
      icon: undefined,
      is_active: true
    });
  });

  it("normalizes professional distance and defaults", () => {
    const normalized = normalizeProfessional({
      id: 1,
      name: "Carlos",
      distance: "12.7",
      categoryIds: [2, "3"],
      online: 1
    });

    expect(normalized).toMatchObject({
      id: "1",
      name: "Carlos",
      distance: 12.7,
      categoryIds: ["2", "3"],
      online: true
    });
  });

  it("returns null for invalid payload", () => {
    expect(normalizeProfessional({ foo: "bar" })).toBeNull();
  });
});
