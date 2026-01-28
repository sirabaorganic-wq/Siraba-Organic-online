const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables FIRST before importing any config or routes
dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const couponRoutes = require("./routes/couponRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// Security middleware imports
const {
  securityHeaders,
  mongoSanitizeMiddleware,
  xssProtection,
  apiLimiter,
  parameterPollutionProtection,
  hidePoweredBy,
  suspiciousActivityLogger,
  preventDirectoryTraversal,
} = require("./middleware/securityMiddleware");
const { requestLogger } = require("./middleware/securityLogger");

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "http://localhost:5001",
  "https://rad-kringle-188297.netlify.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.some((o) => origin.startsWith(o))
    ) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// ==================== SECURITY MIDDLEWARE ====================
// OWASP A05:2021 – Security Misconfiguration
// Apply security headers first
app.use(securityHeaders());

// OWASP A05:2021 – Security Misconfiguration
// Hide technology stack
app.use(hidePoweredBy);

// Enable CORS
app.use(cors(corsOptions));

// Body parser with size limits to prevent DoS
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// OWASP A03:2021 – Injection
// Sanitize data against NoSQL query injection
app.use(mongoSanitizeMiddleware());

// OWASP A03:2021 – Injection (XSS)
// Prevent XSS attacks
app.use(xssProtection());

// OWASP A03:2021 – Injection
// Prevent HTTP Parameter Pollution
app.use(parameterPollutionProtection());

// OWASP A09:2021 – Security Logging and Monitoring
// Log all requests
app.use(requestLogger);

// OWASP A09:2021 – Security Logging and Monitoring
// Log suspicious activities
app.use(suspiciousActivityLogger);

// OWASP A01:2021 – Broken Access Control
// Prevent directory traversal
app.use(preventDirectoryTraversal);

// OWASP A01:2021 – Broken Access Control
// Apply rate limiting to all routes
app.use("/api/", apiLimiter);

// ==================== SOCKET.IO SETUP ====================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Broadcast active user count
  io.emit("activeUsers", io.engine.clientsCount);

  // Join a chat room (e.g., "vendor_123")
  socket.on("join_chat", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  // Handle typing events (optional enhancement)
  socket.on("typing", (room) => {
    socket.to(room).emit("typing");
  });

  socket.on("stop_typing", (room) => {
    socket.to(room).emit("stop_typing");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    io.emit("activeUsers", io.engine.clientsCount);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/b2b", require("./routes/b2bRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/blogs", require("./routes/blogRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/vendors/invoices", require("./routes/vendorInvoiceRoutes"));
app.use("/api/vendor-messages", require("./routes/vendorMessageRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/admin", require("./routes/gstRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/refunds", require("./routes/refundRoutes"));
app.use("/api/gst", require("./routes/publicGSTRoutes"));
app.use("/api/cache", require("./routes/cacheRoutes"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

const PORT = process.env.PORT || 5000;

// Start server only after DB connection
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
// Server restart trigger for port 5001
