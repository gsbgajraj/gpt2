import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectDB } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Application startup
(async () => {
  try {
    // Check required environment variables
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingEnvVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
      process.exit(1);
    }

    console.log('🔍 Connecting to MongoDB...');
    await connectDB();

    console.log('🛠️ Setting up routes...');
    const server = await registerRoutes(app);

    // Health check route before setting up Vite
    app.get("/health", (req, res) => {
      res.json({ status: "ok" });
    });

    // Setup Vite or static serving
    if (app.get("env") === "development") {
      console.log('🔧 Setting up Vite middleware...');
      await setupVite(app, server);
      console.log('✅ Vite middleware setup complete');
    } else {
      console.log('📦 Setting up static file serving...');
      serveStatic(app);
      console.log('✅ Static file serving setup complete');
    }

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('❌ Server error:', err);
      res.status(status).json({ message });
    });

    // Catch-all route to handle client-side routing
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      // Let Vite handle all other routes
      if (app.get("env") === "development") {
        next();
      } else {
        res.sendFile("index.html", { root: "./dist/client" });
      }
    });

    const port = process.env.PORT || 5000;
    console.log(`⏳ Attempting to start server on port ${port}...`);

    server.listen({
      port,
      host: "localhost", // Using localhost for Replit accessibility
    }, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log('📝 Environment:', app.get("env"));
      console.log('🔐 Auth enabled:', !!process.env.JWT_SECRET);
      console.log('🔑 Google auth configured:', !!process.env.GOOGLE_CLIENT_ID);
      console.log('📊 MongoDB connected:', !!process.env.MONGODB_URI);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();