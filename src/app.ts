import express from "express";
import "colors";
import { error } from "./middlewares/error";
import { notFound } from "./middlewares/notFound";
import userRoute from "./routes/user.route";
import devConsole from "./lib/devConsole";
import initialConfig from "./config/appConfig";

// -------- app initialization --------
const app = express();
initialConfig(app);

// -------- routes --------
app.use("/api/v1", userRoute);

app.use(notFound);
app.use(error);
app.listen(process.env.PORT || 5000, () => {
  devConsole(
    `Server listening at http://localhost:${process.env.PORT || 5000}`.yellow
  );
});
