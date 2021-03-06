# jest-time-helpers

Helpers you can use in tests that relate to the passage of time (i.e. code that
involves `setTimeout`, `setInterval`, `new Date()`, `Date.now()`, etc.). Allows
you to "set the clock" to a particular point in time, advancing any `setTimeout`
or `setInterval` calls that need advancing at the same time. Makes it possible
(even pleasant!) to test code that would normally be dependent on the passage of
time, such as scheduled events.

[Documentation](https://www.graphile.org/jest-time-helpers/).

This helper library was born out of
[adding cron functionality](https://github.com/graphile/worker/pull/163) to
[Graphile Worker](https://github.com/graphile/worker) and needing a reliable way
to test it.

If you find this useful, please give it a star ⭐

## Methods

For [full documentation](https://www.graphile.org/jest-time-helpers/), please
click the headers. The following acts as a quick-reference.

### [`setupFakeTimers()`](https://www.graphile.org/jest-time-helpers/modules.html#setupfaketimers)

Import and call the `setupFakeTimers` helper at the top of your test file:

```js
import { setupFakeTimers } from "jest-time-helpers";
const { setTime } = setupFakeTimers();
```

Then inside your tests you can call `setTime(timestamp)` to pretend that the
system time is the timestamp you gave. When you set the timestamp to a value
after the previous timestamp, all timers (`setTimeout`, `setInterval`, etc) will
be advanced by that amount, as well as the "clock". When you set the timestamp
to a value before the previous timestamp, only the clock will be updated and no
timeouts/intervals will be effected.

Example:

```js
const REFERENCE_TIMESTAMP = 950536800000; /* 14th February 2000, 2pm UTC */

test("new Date().toISOString() returns the expected timestamp", () => {
  setTime(REFERENCE_TIMESTAMP);
  // Note, time may have advanced a millisecond or two, so we can't be too precise
  expect(new Date().toISOString()).toMatch(/^2000-02-14T14:00:0.*Z$/);
});
```

### [`sleep(ms: number)`](https://www.graphile.org/jest-time-helpers/modules.html#sleep)

A trivial method that returns a promise that resolves after the given number of
real-time milliseconds. The important part about this method (as opposed to one
that you might write yourself) is that it is not inhibited or influenced by fake
timers.

### [`sleepUntil(condition: () => void, maxDuration = 2000, pollInterval = 2)`](https://www.graphile.org/jest-time-helpers/modules.html#sleepuntil)

Polls the `condition` callback every `pollInterval` milliseconds, and resolves
success when `condition()` returns a truthy value. If `maxDuration` elapses
before `condition()` returns true, returns a rejected promise.

Useful for waiting on external actions without putting arbitrary sleeps in your
code (e.g. waiting for a database record to be created).

Like `sleep()`, it is not inhibited or influenced by fake timers.

## Constants

- `SECOND` - number of milliseconds in a second
- `MINUTE` - number of milliseconds in a minute
- `HOUR` - number of milliseconds in a hour
- `DAY` - number of milliseconds in a day
- `WEEK` - number of milliseconds in a week

## Crowd-funded open-source software

To help us develop software sustainably under the MIT license, we ask all
individuals and businesses that use our software to help support its ongoing
maintenance and development via sponsorship.

### [Click here to find out more about sponsors and sponsorship.](https://www.graphile.org/sponsor/)

## Development

Checkout the repository, then run the following commands:

```
yarn
yarn test
```
