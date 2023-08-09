import "dotenv/config";

import type { FastifyPluginAsync } from "fastify";
import type { StaticRequest } from "./types.js";
import * as path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import fastifyView from "@fastify/view";
import fastifyStatic from "@fastify/static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDirRoot = path.join(__dirname, "..", "public");

const app: FastifyPluginAsync = async (fastify, _opts) => {
	fastify.register(fastifyStatic, { root: publicDirRoot });
	fastify.register(fastifyView, { engine: { ejs } });

	// App views
	fastify.get("/", async (req, reply) => {
		return reply.view("src/templates/index.ejs", {
			user: undefined,
		});
	});

	fastify.get("/dashboard", async (req, reply) => {
		// TODO only show the dashboard if the user is logged in

		return reply.view("src/templates/dashboard.ejs", {
			user: { first_name: "Guest" },
		});
	});

	// all other requests fall through to static files
	fastify.get<StaticRequest>("/:filename", async function (req, reply) {
		const { filename } = req.params;

		return reply.sendFile(filename);
	});
};

export default app;
