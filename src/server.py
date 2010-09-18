
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import os.path

class FileNotFound(object):
    pass

class Server(BaseHTTPRequestHandler):
    paths = {'': '', 
             'js':'js',
             'card': 'card',
             }
    types = {'.html': 'text/html',
             '.js': 'text/javascript',
             '.png': 'image/png',
             }

    def do_GET(self):
        try:
            path = self.path.lstrip('/.')
            path = os.path.join(self.paths[os.path.dirname(path)], os.path.basename(path))
            type_ = os.path.splitext(path)[1]
            if type_ not in self.types:
                raise FileNotFound
            f = open(path, 'rb')
            self.send_response(200)
            self.send_header('Content-type', self.types[type_])
            self.end_headers()
            self.wfile.write(f.read())
            f.close()
            return
        except Exception, e:
            self.send_error(404, 'File not found: %s, %s' % (self.path, e));
            
def main():
    try:
        server = HTTPServer(('', 8080), Server)
        server.serve_forever()
    finally:
        server.socket.close()

if __name__ == '__main__':
    main()
