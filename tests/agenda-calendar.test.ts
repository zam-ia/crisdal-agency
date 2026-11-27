import assert from "node:assert/strict";
import test from "node:test";
import { itemsForDay, monthBounds, monthCells, offsetMonth } from "../app/lib/os/agenda-calendar";
import type { AgendaItem } from "../app/lib/os/agenda";

test("calendar uses Monday-first order and handles leap months and year changes", () => {
  const days = monthCells("2024-02");
  assert.deepEqual(days.slice(0, 4), [null, null, null, "2024-02-01"]);
  assert.equal(days.at(-1), "2024-02-29");
  assert.equal(offsetMonth("2026-12", 1), "2027-01");
  assert.deepEqual(monthBounds("2026-12"), { from: "2026-12-01T00:00:00-05:00", to: "2027-01-01T00:00:00-05:00" });
});

test("agenda detects Lima day overlaps without counting an event ending at midnight twice", () => {
  const event: AgendaItem = {
    id: "cd4337eb-a941-4aa7-b819-6404780102dd", title: "Actividad aislada", category: "produccion", status: "confirmed",
    startsAt: "2026-11-26T23:00:00-05:00", endsAt: "2026-11-27T00:00:00-05:00", notes: "", projectId: null,
    createdAt: "2026-11-26T20:00:00Z", updatedAt: "2026-11-26T20:00:00Z",
  };
  assert.deepEqual(itemsForDay([event], "2026-11-26"), [event]);
  assert.deepEqual(itemsForDay([event], "2026-11-27"), []);
});
