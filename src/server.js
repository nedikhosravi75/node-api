
import Fastify from "fastify";
import pg from "pg";
import cors from "@fastify/cors";
const { Pool } = pg;

const app = Fastify({ logger: true });
await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
});
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

// Get centers by project ID
app.get("/api/projects/:projectId/centers", async (request, reply) => {
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
         id,
         project_id,
         center_code,
         center_name,
         address,
         is_active,
         created_at
       FROM food_centers
       WHERE project_id = $1
       ORDER BY center_code`,
      [projectId]
    );

    return {
      status: "success",
      project: projectResult.rows[0],
      count: result.rowCount,
      centers: result.rows,
    };
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({
      status: "error",
      message: "Could not retrieve project centers",
    });
  }
});

 // Create a new center
app.post("/api/projects/:projectId/centers", async (request, reply) => {
  try {
    const projectId = Number(request.params.projectId);
    const { center_code, center_name, address } = request.body ?? {};

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      return reply.code(400).send({
        status: "error",
        message: "Invalid project ID",
      });
    }

    if (
      typeof center_code !== "string" ||
      !center_code.trim() ||
      typeof center_name !== "string" ||
      !center_name.trim()
    ) {
      return reply.code(400).send({
        status: "error",
        message: "Center code and name are required",
      });
    }

    const project = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND is_active = true",
      [projectId]
    );

    if (project.rowCount === 0) {
      return reply.code(404).send({
        status: "error",
        message: "Project not found",
      });
    }

    const result = await pool.query(
      `INSERT INTO food_centers
       (project_id, center_code, center_name, address, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [
        projectId,
        center_code.trim(),
        center_name.trim(),
        typeof address === "string" && address.trim()
          ? address.trim()
          : null,
      ]
    );

    return reply.code(201).send({
      status: "success",
      center: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return reply.code(409).send({
        status: "error",
        message: "This center code already exists in this project",
      });
    }

    app.log.error(error);
    return reply.code(500).send({
      status: "error",
      message: "Could not create center",
    });
  }
});

// Update an existing center
app.put("/api/centers/:centerId", async (request, reply) => {
  try {
    const centerId = Number(request.params.centerId);
    const { center_code, center_name, address } = request.body ?? {};

    if (!Number.isSafeInteger(centerId) || centerId <= 0) {
      return reply.code(400).send({
        status: "error",
        message: "Invalid center ID",
      });
    }

    if (
      typeof center_code !== "string" ||
      !center_code.trim() ||
      typeof center_name !== "string" ||
      !center_name.trim()
    ) {
      return reply.code(400).send({
        status: "error",
        message: "Center code and name are required",
      });
    }

    const result = await pool.query(
      `UPDATE food_centers
       SET center_code = $1,
           center_name = $2,
           address = $3
       WHERE id = $4
       RETURNING *`,
      [
        center_code.trim(),
        center_name.trim(),
        typeof address === "string" && address.trim()
          ? address.trim()
          : null,
        centerId,
      ]
    );

    if (result.rowCount === 0) {
      return reply.code(404).send({
        status: "error",
        message: "Center not found",
      });
    }

    return {
      status: "success",
      center: result.rows[0],
    };
  } catch (error) {
    if (error.code === "23505") {
      return reply.code(409).send({
        status: "error",
        message: "This center code already exists in this project",
      });
    }

    app.log.error(error);
    return reply.code(500).send({
      status: "error",
      message: "Could not update center",
    });
  }
});

// Change center active status
app.patch("/api/centers/:centerId/status", async (request, reply) => {
  try {
    const centerId = Number(request.params.centerId);
    const { is_active } = request.body ?? {};

    if (!Number.isSafeInteger(centerId) || centerId <= 0) {
      return reply.code(400).send({
        status: "error",
        message: "Invalid center ID",
      });
    }

    if (typeof is_active !== "boolean") {
      return reply.code(400).send({
        status: "error",
        message: "is_active must be true or false",
      });
    }

    const result = await pool.query(
      `UPDATE food_centers
       SET is_active = $1
       WHERE id = $2
       RETURNING *`,
      [is_active, centerId]
    );

    if (result.rowCount === 0) {
      return reply.code(404).send({
        status: "error",
        message: "Center not found",
      });
    }

    return {
      status: "success",
      center: result.rows[0],
    };
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({
      status: "error",
      message: "Could not change center status",
    });
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
