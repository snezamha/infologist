import type { Role } from "@/lib/users/role";

export type DashboardUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  emailVerified: Date | null;
};
