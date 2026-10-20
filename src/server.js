import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok" }));

app.get("/", async () => ({
  message: "Hello from Weblines",
  docs: "https://weblines.ir/docs",
}));

// Example: read a setting from an environment variable set in the console.
app.get("/api/greeting", async (request) => {
  const name = request.query.name ?? "world";
  return { greeting: `${process.env.GREETING ?? "Hello"}, ${name}!` };
});

const port = Number(process.env.PORT ?? 3000);
// 0.0.0.0, not localhost: the platform reaches the app from outside the container.
app.listen({ host: "0.0.0.0", port }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

// Stop cleanly when the platform stops or redeploys the app.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => app.close().then(() => process.exit(0)));
}
