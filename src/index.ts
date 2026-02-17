import * as assert from "assert";
import * as util from "util";

// Grab the setTimeout from global before jest overwrites it with useFakeTimers
const setTimeoutBypassingFakes = global.setTimeout;

type Timeout = ReturnType<typeof setTimeout>;

/**
 * Wait a number of milliseconds of _real time_ (not mocked time); useful for
 * allowing the runloop or external systems to advance.
 *
 * @param ts - how long to sleep for.
 */
export const sleep = (
  ms: number,
  unref = false,
): Promise<void> & { timeout: Timeout } => {
  let timeout!: Timeout;
  const promise = new Promise<void>((resolve) => {
    timeout = setTimeoutBypassingFakes(resolve, ms);
  });
  if (unref) {
    timeout.unref();
  }
  return Object.assign(promise, { timeout });
};

/**
 * Polls until the condition passes.
 *
 * Polls the `condition` callback every `pollInterval` ms of real time. If/when
 * it returns a truthy value, resolves successfully. If `maxDuration` is
 * exceeded before `condition()` returns true, rejects with an error.
 *
 * @param condition - a callback function that should return true when no more sleep is required
 * @param maxDuration - an optional maximum duration to sleep
 * @param pollInterval - an optional period of how long we should wait between checks; lower values increase load on the server but may make tests pass faster, larger values are more efficient but increase test latency.
 */
export async function sleepUntil(
  condition: () => boolean,
  maxDuration = 2000,
  pollInterval = 2,
): Promise<void> {
  assert.ok(pollInterval >= 1, "pollInterval must be >= 1 millisecond");
  if (condition()) {
    // Already fine, no need to sleep
    return;
  }

  // Wait for condition to pass
  const start = realNow();
  while (realNow() - start < maxDuration) {
    await sleep(pollInterval);
    if (condition()) {
      // Success
      return;
    }
  }

  // maxDuration exceeded
  throw new Error(
    `Slept for ${Date.now() - start}ms but condition never passed`,
  );
}

/**
 * This is for letting the Node.js event loop advance, e.g. when `setTimeout`
 * has `await` in the chain.
 *
 * @internal
 */
async function aFewRunLoops(count = 5) {
  for (let i = 0; i < count; i++) {
    await sleep(0);
  }
}

const OriginalDate = global.Date;

/**
 * Returns the real-world current timestamp (unaffected by fake timers).
 */
function realNow() {
  return OriginalDate.now();
}

/**
 * Sets up fake timers and Date implementation within your Jest test file. You
 * should call this at the top of the file (**not** within a test or an
 * after/before); tests that need fake timers should go into their own test
 * file.
 *
 * Returns an object containing a `setTime` function which you can use to set
 * the current (fake) date within your test to a particular JavaScript
 * timestamp (number of milliseconds since 1970-01-01T00:00:00Z).
 *
 * Enables the `jest.useFakeTimers()` integration, and overwrites `global.Date`
 * with a custom function that automatically applies your test file's given
 * offset.
 */
export function setupFakeTimers() {
  let interval: ReturnType<typeof setInterval> | null = null;
  beforeEach(() => {
    interval = setInterval(() => {
      jest.advanceTimersByTime(0);
    }, 10);
    jest.useFakeTimers();
  });
  afterEach(() => {
    void jest.useRealTimers();
    if (interval != null) {
      clearInterval(interval);
    }
  });

  /**
   * Sets the fake time such that a call to `Date.now()` (or `new Date()`)
   * would return this timestamp if called immediately (but time continues to
   * progress as expected after this). Also advances the timers by the
   * difference from the previous time, if positive. Setting time backwards is
   * allowed (like setting back the system clock on a computer), but will not
   * advance (or undo the advancement of) any timers.
   *
   * Since advancing the time a few hours might not run all the intermediary
   * code quite right, we actually step it up by a configurable increment
   * (defaults to one minute) at a time. Setting time backwards (no matter how
   * far back) is done all at once.
   *
   * @param targetTimestamp - the target timestamp
   * @param increment - the maximum we should advance time by at once in order to step towards `timestamp`
   */
  async function setTime(targetTimestamp: number, increment = MINUTE) {
    assert.strictEqual(
      typeof targetTimestamp,
      "number",
      `Expected \`setTime\` to be passed a number of milliseconds, instead received '${util.inspect(
        targetTimestamp,
      )}'`,
    );

    if (targetTimestamp < Date.now()) {
      jest.setSystemTime(targetTimestamp);
    } else {
      while (Date.now() + increment < targetTimestamp) {
        jest.advanceTimersByTime(increment);
        await aFewRunLoops();
      }
      if (Date.now() < targetTimestamp) {
        jest.advanceTimersByTime(targetTimestamp - Date.now());
        await aFewRunLoops();
      }
    }
  }

  // In future we may add other methods such as `setTimeWithoutAdvancingTimers`
  // to emulate the system clock changing without real time elapsing.
  return { setTime, realNow };
}

/** One second in milliseconds */
export const SECOND = 1000;
/** One minute in milliseconds */
export const MINUTE = 60 * SECOND;
/** One hour in milliseconds */
export const HOUR = 60 * MINUTE;
/** One day in milliseconds */
export const DAY = 24 * HOUR;
/** One week in milliseconds */
export const WEEK = 7 * DAY;
