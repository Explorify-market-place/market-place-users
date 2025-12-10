import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role?: "user" | "vendor" | "admin";
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: "user" | "vendor" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "user" | "vendor" | "admin";
  }
}
