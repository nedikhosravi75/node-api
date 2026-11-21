
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

// Get foods by project ID
app.get("/api/projects/:projectId/foods", async (request, reply) => {
  try {
    const projectId = Number(request.params.projectId);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      return reply.code(400).send({
        status: "error",
        message: "Invalid project ID",
      });
    }

    const projectResult = await pool.query(
      `SELECT id, project_code, project_name
       FROM projects
       WHERE id = $1 AND is_active = true`,
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      return reply.code(404).send({
        status: "error",
        message: "Project not found",
      });
    }

    const result = await pool.query(
      `SELECT
         f.id,
         f.food_code,
         f.food_name,
         f.description,
         fc.id AS category_id,
         fc.category_name,
         fs.id AS subcategory_id,
         fs.subcategory_name
       FROM foods f
       JOIN food_categories fc
         ON fc.id = f.category_id
        AND fc.project_id = f.project_id
       JOIN food_subcategories fs
         ON fs.id = f.subcategory_id
        AND fs.category_id = fc.id
       WHERE f.project_id = $1
         AND f.is_active = true
       ORDER BY f.food_code`,
      [projectId]
    );

    return {
      status: "success",
      project: projectResult.rows[0],
      count: result.rowCount,
      foods: result.rows,
    };
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({
      status: "error",
      message: "Could not retrieve project foods",
    });
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
