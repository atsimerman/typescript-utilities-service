import * as app from "./app.sql.js";
import * as auth from "./auth.sql.js";

export const schema = {
	...auth,
	...app,
};
