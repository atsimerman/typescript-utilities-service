import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authClientOptions = { plugins: [adminClient()] };

export const authClient: ReturnType<
	typeof createAuthClient<typeof authClientOptions>
> = createAuthClient(authClientOptions);
