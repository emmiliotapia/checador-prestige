# SmartOps Local Bridge (Bypass Offline-First)

Este módulo es un **Agente Local** diseñado para interceptar las checadas biométricas del reloj ZKTeco de manera instantánea, evitando que el dispositivo se "trabe" o congele cuando hay fluctuaciones de red o latencia alta al comunicarse con el VPS en la nube.

## ¿Cómo funciona?
1. El Reloj ZKTeco se configura para enviar sus datos a la IP de la computadora local (Ej. `192.168.1.100`) en el puerto `8080`.
2. El **Local Bridge** recibe la checada en menos de 5 milisegundos, la guarda en una base de datos local oculta (`bridge_cache.db`) y le contesta `OK` al reloj.
3. El reloj se libera instantáneamente para que la siguiente persona pueda checar sin hacer filas.
4. En segundo plano, un hilo de sincronización revisa el caché local y envía los datos de manera silenciosa y segura al VPS (`https://time-prestige.smartopsia.com`). Si se corta el internet, los guarda hasta que vuelva la conexión.

## Requisitos
- Una computadora (Windows, Linux, o Mac) que esté encendida durante los horarios de checada.
- Estar conectada a la misma red local (LAN o Wi-Fi) que el reloj ZKTeco.
- Tener instalado **Python 3.10** o superior.

## Instalación y Ejecución (Windows)
1. Descarga o clona esta carpeta `local_bridge` en la computadora del casino.
2. Haz doble clic en el archivo `ejecutar.bat`.
3. La primera vez tardará unos segundos en descargar e instalar las librerías necesarias.
4. Verás una pantalla negra (Terminal) que dice:
   `🟢 SmartOps Local Bridge Iniciado 🟢`

¡Déjala minimizada y listo!

## Configuración del Reloj ZKTeco
En el menú del reloj físico, ve a **Configuración de Red** -> **Configuración Servidor Cloud (ADMS)** y pon los siguientes datos:
- **Dirección del Servidor:** La IP de tu computadora (por ejemplo, `192.168.1.50`).
- **Puerto del Servidor:** `8080`

Para saber tu IP local en Windows, abre una consola (`cmd`) y escribe `ipconfig`, busca la línea que dice `IPv4 Address`.
