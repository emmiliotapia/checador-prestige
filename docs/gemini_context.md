# SmartOps Strategy: El "Por Qué" del Arqui

## Visión de Negocio
Este sistema no es solo una utilidad de control de asistencia, sino un **MVP de SaaS Multi-tenant**. El objetivo es validar el modelo de negocio con "Casino Prestige" para posteriormente ofrecer licencias anuales a otros clientes del sector.

## Objetivos Estratégicos
1. **Automatización de Nómina**: El caso de uso crítico es reducir el tiempo de generación del reporte semanal de asistencia, que actualmente es un proceso manual propenso a errores.
2. **Integración Transparente**: El sistema debe conectarse a los relojes checadores físicos existentes sin requerir cambios de hardware.
3. **Escalabilidad Horizontal**: La arquitectura basada en UUIDs y `tenant_id` permite añadir nuevos clientes en el mismo backend sin cruce de datos.

## Principios de Desarrollo
- **Estabilidad del Webhook**: El receptor de datos de ZKTeco es la parte más crítica. No debe fallar, ya que los dispositivos físicos tienen memoria limitada.
- **Interfaz Limpia**: El dashboard debe ser intuitivo y evitar la saturación de opciones. El enfoque actual es: Listar Empleados, Configurar Áreas y Exportar Reportes.
- **Integridad de Datos**: El sistema tiene prohibido borrar o modificar registros enviados por los aparatos; solo debe leerlos y almacenarlos cronológicamente para auditoría.
