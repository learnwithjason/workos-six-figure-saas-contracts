import type { RequestGenericInterface } from "fastify";

declare module "fastify" {
	interface Session {
		user: {
			id: string;
			first_name?: string;
			last_name?: string;
			email: string;
		};
	}
}

export interface StaticRequest extends RequestGenericInterface {
	Params: {
		filename: string;
	};
}

export interface RedirectRequest extends RequestGenericInterface {
	Querystring: {
		code: string;
	};
}
