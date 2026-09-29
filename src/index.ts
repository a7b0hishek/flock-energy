import { buildApp } from './app';
import { config } from './config';

const app = buildApp();

app.listen({ host: '0.0.0.0', port: config.PORT }).then(() => {
  // Server started successfully.
}).catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
