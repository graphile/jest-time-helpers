import { setupFakeTimers } from "../src";
import { jest, test, expect } from "@jest/globals";

const { setTime, realNow } = setupFakeTimers();
const REFERENCE_TIMESTAMP = 950536800000; /* 14th February 2000, 2pm UTC */

test("Date.now() starts at the right time", () => {
  const nowAccordingToDateNow = Date.now();
  const nowAccordingRealNow = realNow();
  const difference = Math.abs(nowAccordingRealNow - nowAccordingToDateNow);
  // Expect the difference between these two to be less than 10 milliseconds
  expect(difference).toBeLessThanOrEqual(10);
});

test("Date.now() and +new Date() return the expected time when setTime is used", () => {
  setTime(REFERENCE_TIMESTAMP);
  const nowAccordingToDateNow = Date.now();
  const nowAccordingToNewDate = +new Date();
  const nowAccordingToRealNow = realNow();

  // This is a check to make sure that realNow is giving a reasonable value
  expect(nowAccordingToRealNow).toBeGreaterThan(
    1610623893028 /* 14th Jan 2021, 11:31am UTC */,
  );

  const differenceDateNow = Math.abs(
    REFERENCE_TIMESTAMP - nowAccordingToDateNow,
  );
  const differenceNewDate = Math.abs(
    REFERENCE_TIMESTAMP - nowAccordingToNewDate,
  );
  // Expect the difference between these two to be less than 10 milliseconds
  expect(differenceDateNow).toBeLessThanOrEqual(10);
  expect(differenceNewDate).toBeLessThanOrEqual(10);
});

test("new Date().toISOString() returns the expected timestamp when setTime is used", () => {
  setTime(REFERENCE_TIMESTAMP);
  expect(new Date().toISOString()).toMatch(/^2000-02-14T14:00:0.*Z$/);
});

test("new Date(3000) returns the expected timestamp", () => {
  setTime(REFERENCE_TIMESTAMP);
  expect(new Date(3000).toISOString()).toMatch(/^1970-01-01T00:00:03.000Z$/);
});

test("Advancing timers works as expected", () => {
  setTime(REFERENCE_TIMESTAMP);
  let called = false;
  setTimeout(() => {
    called = true;
  }, 1000);

  // Nothing's happened yet
  expect(called).toBe(false);

  // Advancing 500ms shouldn't be enough to call the timer
  setTime(REFERENCE_TIMESTAMP + 500);
  expect(called).toBe(false);

  // Advancing another 600ms should be enough for the 1000ms timer to be called
  setTime(REFERENCE_TIMESTAMP + 500 + 600);
  expect(called).toBe(true);
});

test("Clock skew (going back in time) doesn't break timers", () => {
  setTime(REFERENCE_TIMESTAMP);
  let called = false;
  setTimeout(() => {
    called = true;
  }, 1000);

  // Nothing's happened yet
  expect(called).toBe(false);

  // Advancing 500ms shouldn't be enough to call the timer
  setTime(REFERENCE_TIMESTAMP + 500);
  expect(called).toBe(false);

  // R-r-r-r-rewind! 300ms
  // NOTE: rewinding the clock does **NOT** undo timer advancement, just like
  // setting the computer clock back a couple minutes does not undo all the
  // work that happened in the last 2 minutes.
  setTime(REFERENCE_TIMESTAMP + 500 - 300);
  expect(called).toBe(false);

  // Advancing 450ms from previous timestamp shouldn't be enough to call the timer (total advancement: 950ms)
  setTime(REFERENCE_TIMESTAMP + 500 - 300 + 450);
  expect(called).toBe(false);

  // Advancing another 100ms (total advancement: 1050ms) should be enough to call the timer
  setTime(REFERENCE_TIMESTAMP + 500 - 300 + 450 + 100);
  expect(called).toBe(true);
});
