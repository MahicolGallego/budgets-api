import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1/');

  //enable CORS (Cross-Origin Resource Sharing)
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //enable deserialization of response objects (apply class-transformer)
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  //Config Swagger to API Documentation
  const config = new DocumentBuilder()
    .setTitle('Budget management API')
    .setDescription(`An API meant for customers to manage their numbers!`)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('budgets-management/api/v1/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
