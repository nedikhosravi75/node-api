
import Fastify from "fastify";
import pg from "pg";

const { Pool } = pg;

const app = Fastify({ logger: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

app.get("/health", async () => ({ status: "ok" }));

app.get("/", async () => ({
  message: "Atyieh Food Management API",
  status: "running",
}));

app.get("/api/db-check", async (request, reply) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    return {
      status: "connected",
      database_time: result.rows[0].database_time,
    };
  } catch (error) {
    app.log.error(error);
    reply.code(500);

    return {
      status: "error",
      message: "Database connection failed",
    };
  }
});

// Get active projects
app.get("/api/projects", async (request, reply) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        project_code,
        project_name,
        description,
        is_active
      FROM projects
      WHERE is_active = true
      ORDER BY project_code
    `);

    return {
      status: "success",
      count: result.rowCount,
      projects: result.rows,
    };
  } catch (error) {
    app.log.error(error);
    reply.code(500);

    return {
      status: "error",
      message: "Could not retrieve projects",
    };
  }
});

const port = Number(process.env.PORT ?? 3000);

app.listen({ host: "0.0.0.0", port }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, async () => {
    await pool.end();
    await app.close();
    process.exit(0);
  });
}
