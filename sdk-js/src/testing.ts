// `@haakco/custd-sdk/testing`: an in-memory Custd for app tests, typed against this SDK's DTOs.
export {
  FAKE_CUSTD_API_PATH,
  FAKE_CUSTD_AUTH_PATH,
  FAKE_CUSTD_ORIGIN,
  FAKE_CUSTD_SITE_KEY,
  type FakeCapturedError,
  FakeCustd,
  type FakeCustdOptions,
  type FakeCustdRecordedRequest,
  type FakeCustdRequest,
  type FakeCustdResponse,
  type FakeTrackedEvent,
  memorySignInStorage,
  signInWithFake,
} from "./testing/fake-custd.js";
export { FakeCustdProblem } from "./testing/fake-results.js";
