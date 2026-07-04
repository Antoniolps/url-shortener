import { RabbitMQModule as GolevelupRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { URL_EVENTS_EXCHANGE } from './rabbitmq.constants';
import { RabbitMQPublisherService } from './rabbitmq-publisher.service';

@Global()
@Module({
  imports: [
    GolevelupRabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('RABBITMQ_URL'),
        exchanges: [{ name: URL_EVENTS_EXCHANGE, type: 'topic' }],
        // wait: false — broker indisponível não bloqueia o boot (fail-open);
        // a conexão é reestabelecida em background.
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  providers: [RabbitMQPublisherService],
  // Reexporta o módulo do golevelup para AmqpConnection ficar injetável
  // em consumers (ex: ClickWorkerService).
  exports: [RabbitMQPublisherService, GolevelupRabbitMQModule],
})
export class RabbitMQModule {}
