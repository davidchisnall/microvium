/*---
runExportedFunction: 0
description: Tests async-await functionality with promises
assertionCount: 5
isAsync: true
# testOnly: true
# skip: true
---*/
vmExport(0, run);

function run() {
  // Void-call async function
  runAsync();
}

async function runAsync() {
  try {
    test_asyncReturnsPromise();
    test_promiseKeys();
    await test_promiseAwait();

    asyncTestComplete(true, undefined);
  } catch (e) {
    asyncTestComplete(false, e);
  }
}

function test_asyncReturnsPromise() {
  const promise = myAsyncFunc();
  assert(promise.__proto__ === Promise.prototype);
}

async function myAsyncFunc() {
  return 42;
}

async function test_promiseKeys() {
  const promise = myAsyncFunc();
  const keys = Reflect.ownKeys(promise);
  // Even though the promise has 2 internal slots, which occupy the first
  // key-value pair slot, it should still have no own properties since the
  // the key used for internal slots is not a valid property key.
  assertEqual(keys.length, 0);

  // Reflect.ownKeys is ignoring the internal slots but should not ignore the
  // properties that follow the internal slots
  promise.prop = 5;
  const keys2 = Reflect.ownKeys(promise);
  assertEqual(keys2.length, 1);
  assertEqual(keys2[0], 'prop');
}

async function test_promiseAwait() {
  const promise = myAsyncFunc();
  const result = await promise;
  assertEqual(result, 42);
}

// TODO: awaiting a promise that rejects
// TODO: await must be asynchronous on job queue
// TODO: multiple awaits on the same promise
// TODO: awaiting an already-resolved promise
// TODO: awaiting an already-rejected promise
// TODO: augmenting promise prototype
// TODO: expression-call of host async function (should synthesize a promise)
// TODO: Test with object errors and return values to make sure GC stuff is right for those

// TODO: new Promise
// TODO: Promise.then
// TODO: Promise.catch

// TODO: Update documentation with promise design and AsyncComplete

// TODO: Export async function?

// TODO: await over snapshot (requires promise support because CTVM doesn't have `vm.startAsync`)

// TODO: test encoding and decoding of an async function where the entry point
// is only reachable through the continuation (i.e. a partially executed async
// function where the original function is not reachable anymore but the
// continuation is). This can probably be achieved by using `vmExport` on the
// result of `mvm_asyncStart`.

// TODO: Top-level await -- what happens?

// WIP Bump the version numbers, since we have new builtins and operations