import { cache } from "react";

import { getUserRole as loadUserRole } from "@/lib/users/role";

export const getUserRole = cache(loadUserRole);
