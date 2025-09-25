import http.server
import socketserver
import webbrowser

PORT = 8000


def main():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("Starting server on port: " + str(PORT))
        webbrowser.open('http://localhost:8000/', new=2)
        httpd.serve_forever()


if __name__ == "__main__":
    main()

# same as
# run python -m http.server in the directory
# open browser to http://localhost:8000/