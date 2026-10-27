/**
 * NextAuth v5 catch-all route handler.
 * Exports GET and POST from the handlers object returned by NextAuth().
 */
import { handlers } from "@/server/lib/auth";

export const { GET, POST } = handlers;
