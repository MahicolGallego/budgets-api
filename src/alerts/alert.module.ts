import { Module } from '@nestjs/common';
import AlertsGateway from './alert.gateway';

@Module({
    providers: [AlertsGateway],  // Registra el Gateway como proveedor
    exports: [AlertsGateway],   // Registra el Gateway aquí
})
export class AlertsModule {}