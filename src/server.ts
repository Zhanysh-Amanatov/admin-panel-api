/* Local dependencies */
import app from "./app";
import { initMinioBucket } from "./config/minio";

const PORT = process.env.PORT;

initMinioBucket()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to MinIO error:", err);
    process.exit(1);
  });
