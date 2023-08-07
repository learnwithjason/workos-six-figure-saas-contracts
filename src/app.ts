import "dotenv/config";

import type { FastifyPluginAsync, RequestGenericInterface } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyView from "@fastify/view";
import fastifyStatic from "@fastify/static";
import ejs from "ejs";
import { WorkOS } from "@workos-inc/node";
import * as path from "path";
import { fileURLToPath } from "url";

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

interface StaticRequest extends RequestGenericInterface {
	Params: {
		filename: string;
	};
}

interface RedirectRequest extends RequestGenericInterface {
	Querystring: {
		code: string;
	};
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientID = process.env.WORKOS_CLIENT_ID!;
const organization = process.env.WORKOS_ORG_ID;

const app: FastifyPluginAsync = async (fastify, _opts) => {
	// Fastify plugins and config
	fastify.register(fastifyCookie);
	fastify.register(fastifySession, {
		secret: process.env.SESSION_SECRET!,
		cookie:
			process.env.NODE_ENV === "production"
				? {
						path: "/",
						maxAge: 86400,
						httpOnly: true,
						secure: true,
						sameSite: true,
				  }
				: { secure: false },
	});

	fastify.register(fastifyView, { engine: { ejs } });

	fastify.register(fastifyStatic, {
		root: path.join(__dirname, "..", "public"),
	});

	// WorkOS SSO flow
	fastify.get("/auth/sso", async (_req, res) => {
		const authorizationUrl = workos.sso.getAuthorizationURL({
			organization,
			clientID,
			redirectURI: "http://localhost:3000/auth/sso/redirect",
		});

		res.redirect(authorizationUrl);
	});

	fastify.get<RedirectRequest>("/auth/sso/redirect", async (req, res) => {
		const { code } = req.query;

		const { profile } = await workos.sso.getProfileAndToken({
			code,
			clientID,
		});

		req.session.user = {
			id: profile.id,
			first_name: profile.first_name,
			last_name: profile.last_name,
			email: profile.email,
		};

		return res.redirect("/dashboard");
	});

	fastify.get("/auth/logout", async (req, reply) => {
		req.session.destroy();
		reply.redirect("/");
	});

	// App views
	fastify.get("/", async (req, reply) => {
		const user = req.session.user;

		return reply.view("src/templates/index.ejs", {
			user,
		});
	});

	fastify.get("/dashboard", async (req, reply) => {
		if (!req.session.user?.id) {
			return reply.redirect("/auth/sso");
		}

		const user = req.session.user;

		return reply.view("src/templates/dashboard.ejs", {
			user,
		});
	});

	// all other requests fall through to static files
	fastify.get<StaticRequest>("/:filename", async function (request, reply) {
		const { filename } = request.params;

		return reply.sendFile(filename);
	});
};

export default app;
export { app };
