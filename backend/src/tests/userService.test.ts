import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  findUserById: vi.fn(),
  findUserByEmail: vi.fn(),
  countActiveAdmins: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  listUsers: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("../repositories/userRepository", () => mocks);

import { editUserAccount, removeUserAccount, LastAdminError } from "../services/userService";

function baseAdmin() {
  return {
    id: "admin-1",
    name: "Admin",
    email: "admin@vantta.com",
    password_hash: "hash",
    role: "admin" as const,
    status: "active" as const,
    created_at: new Date(),
  };
}

describe("editUserAccount", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects demoting the only active admin", async () => {
    mocks.findUserById.mockResolvedValue(baseAdmin());
    mocks.countActiveAdmins.mockResolvedValue(0);

    await expect(editUserAccount("admin-1", { role: "user" })).rejects.toThrow(LastAdminError);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("rejects deactivating the only active admin", async () => {
    mocks.findUserById.mockResolvedValue(baseAdmin());
    mocks.countActiveAdmins.mockResolvedValue(0);

    await expect(editUserAccount("admin-1", { status: "inactive" })).rejects.toThrow(
      LastAdminError
    );
  });

  it("allows demoting an admin when another active admin remains", async () => {
    mocks.findUserById.mockResolvedValue(baseAdmin());
    mocks.countActiveAdmins.mockResolvedValue(1);
    mocks.updateUser.mockResolvedValue({ ...baseAdmin(), role: "user" });

    await expect(editUserAccount("admin-1", { role: "user" })).resolves.toBeDefined();
    expect(mocks.updateUser).toHaveBeenCalled();
  });
});

describe("removeUserAccount", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects deleting the only active admin", async () => {
    mocks.findUserById.mockResolvedValue(baseAdmin());
    mocks.countActiveAdmins.mockResolvedValue(0);

    await expect(removeUserAccount("admin-1")).rejects.toThrow(LastAdminError);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
