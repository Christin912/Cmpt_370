import http.server
import socketserver

PORT = 8000

def main():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("Starting server on port: " + str(PORT))
        httpd.serve_forever()

if __name__ == "__main__":
    main()
