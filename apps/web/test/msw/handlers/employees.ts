import { http, HttpResponse } from "msw";
import type { Employee, PaginatedResponse } from "@salary-mgmt/types";

const API_BASE = "http://localhost:3001";

export const mockEmployee: Employee = {
  id: "11111111-1111-1111-1111-111111111111",
  employeeCode: "EMP001",
  name: "Alice Smith",
  email: "alice@example.com",
  department: "Engineering",
  designation: "Engineer",
  country: "IN",
  currency: "INR",
  joiningDate: "2023-01-01",
  employmentStatus: "ACTIVE",
  costCenter: null,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};

export const mockPage: PaginatedResponse<Employee> = {
  data: [mockEmployee],
  page: 1,
  pageSize: 25,
  total: 1,
};

export const employeeHandlers = [
  http.get(`${API_BASE}/v1/employees`, () => {
    return HttpResponse.json(mockPage);
  }),

  http.get(`${API_BASE}/v1/employees/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockEmployee, id: params.id as string });
  }),

  http.post(`${API_BASE}/v1/employees`, () => {
    return HttpResponse.json(mockEmployee, { status: 201 });
  }),

  http.patch(`${API_BASE}/v1/employees/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockEmployee, id: params.id as string });
  }),

  http.delete(`${API_BASE}/v1/employees/:id`, ({ params }) => {
    return HttpResponse.json({
      ...mockEmployee,
      id: params.id as string,
      employmentStatus: "TERMINATED",
    });
  }),
];
