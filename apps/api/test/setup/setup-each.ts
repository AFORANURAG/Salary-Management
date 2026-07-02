import { afterAll, beforeAll, beforeEach } from "vitest";
import {
  destroyTestDataSource,
  initTestDataSource,
  truncateAll,
} from "../utils/test-data-source";

beforeAll(async () => {
  await initTestDataSource();
});

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await destroyTestDataSource();
});
