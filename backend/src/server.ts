import app, { initializeApplication } from './app';
import { SchedulerService } from './services/schedulerService';

type NodeEnv = 'development' | 'production' | 'test' | string;

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ENV = (process.env.NODE_ENV as NodeEnv) || 'development';

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  await initializeApplication();
  app.locals.isReady = true;
  console.log('✅ Readiness: application is ready to serve traffic.');

  if (ENV !== 'test') {
    SchedulerService.start();
    console.log('⏰ Scheduler service started.');
  }
  
  console.log('✅ Application fully initialized and ready!');
});

export default server;
