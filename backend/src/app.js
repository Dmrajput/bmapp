import cors from "cors";
import express from "express";
import audioRoutes from "./routes/audio.routes.js";
import musicRoutes from "./routes/music.routes.js";
import testRoutes from "./routes/test.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", testRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/audio", audioRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;
