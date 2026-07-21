/*External dependencies */
import express from "express";

/*Local dependencies */
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

export default app;
