# SmartOps Protocol: El Manual de la Máquina

## Protocolo ADMS (ZKTeco)
El sistema actúa como un servidor **ADMS (Automatic Data Master Server)**. Los dispositivos físicos inician la comunicación mediante peticiones HTTP POST hacia nuestro backend.

### Endpoint: `POST /iclock/cdata`
Este es el punto de entrada vital para el flujo de asistencia.

#### Payload de Entrada
- **Content-Type**: `text/plain`.
- **Query Params**: Incluye `SN` (Número de Serie del dispositivo).
- **Body**: Líneas de texto separadas por tabuladores (`\t`).
  - Ejemplo: `1001\t2026-04-27 08:30:00\t0\t0\t0\t0`
  - Formato: `ID_RELOJ\tTIMESTAMP\tTIPO\tVERIFICACION\tWORKCODE\tRESERVADO`

#### Lógica del Parser
1. El sistema lee el body como texto plano.
2. Divide por líneas y luego por tabuladores.
3. Extrae `id_reloj` (primer elemento) y el timestamp.
4. Busca al empleado en la base de datos que coincida con ese `id_reloj`.
5. Si existe, crea un registro en la tabla `registros` asociado al empleado y su respectivo `tenant_id`.

#### Respuesta Requerida
Es **CRÍTICO** que la respuesta del servidor sea:
- **Status**: `200 OK`.
- **Content-Type**: `text/plain`.
- **Body**: `OK`.

> [!IMPORTANT]
> Si el servidor responde en JSON o con un formato distinto a "OK" en texto plano, el dispositivo ZKTeco no limpiará su memoria interna y podría entrar en un bucle de reintentos infinitos, bloqueando el dispositivo.

## Verificación de Recepción
Para verificar que los datos están llegando correctamente sin depender de reportes históricos, se puede consultar el feed de actividad en tiempo real:
- **Dashboard**: El tablero principal muestra los últimos registros recibidos mediante polling automático.
- **API**: `GET /api/registros/recientes?tenant_id={UUID}`

### Pruebas de Integración (Simulación)
Se ha incluido un script en `scratch/test_zkteco_push.py` que permite simular el envío de una marcación desde un dispositivo físico. Esto es útil para validar la cadena completa (Webhook -> DB -> Dashboard) sin necesidad de hardware.
