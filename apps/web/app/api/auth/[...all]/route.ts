import createAuth from "@repo/auth";
import { toNextJsHandler } from "better-auth/next-js";

const auth = createAuth();

export const { GET, POST } = toNextJsHandler(auth);
