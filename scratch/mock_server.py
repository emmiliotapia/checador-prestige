from http.server import HTTPServer, BaseHTTPRequestHandler
import sys

class MockADMSHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        print(f"\n[GET] {self.path}")
        print(self.headers)
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        # Typical ZKTeco Initialization Response
        self.wfile.write(b"Registry=OK\n")
        self.wfile.write(b"GET OPTION FROM: 192.168.108.109\n")
        self.wfile.write(b"ATTLOGStamp=0\n")
        self.wfile.write(b"OPERLOGStamp=0\n")
        self.wfile.write(b"ATTPHOTOStamp=0\n")
        self.wfile.write(b"ErrorDelay=60\n")
        self.wfile.write(b"Delay=30\n")
        self.wfile.write(b"TransTimes=00:00;14:00\n")
        self.wfile.write(b"TransInterval=1\n")

    def do_POST(self):
        print(f"\n[POST] {self.path}")
        print(self.headers)
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            post_data = self.rfile.read(content_length)
            print("--- BODY ---")
            print(post_data.decode('utf-8', errors='ignore'))
            print("------------")
            
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK\n")

if __name__ == "__main__":
    port = 80
    print(f"Iniciando Servidor Trampa ADMS en el puerto {port}...")
    print("Esperando a que el checador se conecte...")
    try:
        server = HTTPServer(("0.0.0.0", port), MockADMSHandler)
        server.serve_forever()
    except Exception as e:
        print(f"Error: {e}")
        print("Asegurate de ejecutar esto como administrador si el puerto 80 esta bloqueado.")
