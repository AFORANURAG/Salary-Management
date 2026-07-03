import { setupServer } from "msw/node";
import { employeeHandlers } from "./handlers/employees";

export const server = setupServer(...employeeHandlers);
