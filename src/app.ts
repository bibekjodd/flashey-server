import 'colors';
import express from 'express';
import initialConfig from './config/initial-config';
import { env } from './config/env.config';
import devConsole from './lib/dev-console';
import { handleErrorRequest } from './middlewares/handle-error-request';
import { notFound } from './middlewares/not-found';
import chatRoute from './routes/chat.route';
import messageRoute from './routes/message.route';
import userRoute from './routes/user.route';

// -------- app initialization --------
const app = express();
initialConfig(app);

// -------- routes --------
app.use('/api/v1', userRoute);
app.use('/api/v1', chatRoute);
app.use('/api/v1', messageRoute);

app.use(notFound);
app.use(handleErrorRequest);
app.listen(env.PORT || 5000, () => {
  devConsole(`Server listening at http://localhost:${env.PORT || 5000}`.yellow);
});
