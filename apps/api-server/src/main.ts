import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for the dashboard
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      process.env.DASHBOARD_URL || 'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        Serv-I Cybersecurity API              ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  🌐 Server:   http://localhost:${port}          ║`);
  console.log(`║  🤖 Provider: ${(process.env.AI_PROVIDER || 'openai').padEnd(30)}║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
}

bootstrap();