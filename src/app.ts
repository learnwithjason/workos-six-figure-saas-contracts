import "dotenv/config";

import type { FastifyPluginAsync } from "fastify";
import type { StaticRequest, RedirectRequest } from "./types.js";
import * as path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import fastifyView from "@fastify/view";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import { WorkOS } from "@workos-inc/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workos = new WorkOS(process.env.WORKOS_API_KEY);

const app: FastifyPluginAsync = async (fastify, _opts) => {
	const publicDirRoot = path.join(__dirname, "..", "public");
	fastify.register(fastifyStatic, { root: publicDirRoot });
	fastify.register(fastifyView, { engine: { ejs } });

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

	// WorkOS SSO flow
	fastify.get("/auth/sso", async (_req, res) => {
		const authorizationUrl = workos.sso.getAuthorizationURL({
			clientID: process.env.WORKOS_CLIENT_ID!,
			organization: process.env.WORKOS_ORG_ID,
			redirectURI: process.env.REDIRECT_URI!,
		});

		res.redirect(authorizationUrl);
	});

	fastify.get<RedirectRequest>("/auth/sso/redirect", async (req, res) => {
		const { code } = req.query;
		const { profile } = await workos.sso.getProfileAndToken({
			code,
			clientID: process.env.WORKOS_CLIENT_ID!,
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

		return reply.view("src/templates/dashboard.ejs", {
			user: req.session.user,
		});
	});

	// all other requests fall through to static files
	fastify.get<StaticRequest>("/:filename", async function (request, reply) {
		const { filename } = request.params;

		return reply.sendFile(filename);
	});
};

export default app;
