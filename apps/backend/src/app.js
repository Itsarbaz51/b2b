import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { StaticRoutes } from "./routers/staticRoutes.js";
import { requestId } from "./middlewares/requestId.middleware.js";
import { rateLimiterMiddleware } from "./middlewares/rateLimiter.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://tsg8g0ksk4os8s48ocw8ckws.147.93.20.127.sslip.io",
        "https://7m6g6bvg-5173.inc1.devtunnels.ms",
        "http://localhost:5173",
      ];
      // const allowed = [
      //   process.env.CLIENT_URL , "https://7m6g6bvg-5173.inc1.devtunnels.ms"
      // ];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(helmet());
app.use(requestId);
app.use(rateLimiterMiddleware);

app.get("/health", (req, res) => {
  res.json({ status: "ok", requestId: req.requestId });
});

StaticRoutes(app);
app.use(errorHandler);

export default app;
