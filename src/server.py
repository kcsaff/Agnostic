
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import os.path
import threading
import re

class TOZ(object):
    objects = {}
    transactions = []
    transaction_offset = 1
    
    def __init__(self):
        self.lock = threading.RLock()

    def _decode(self, value):
        if value == '':
            return None
        else:
            return int(value)

    def parse(self, data):
        result = []
        data = data.split('..')
        for datum in data[1:]:
            transaction, object_, payload = re.match('t([0-9]*)o([0-9])*z(.*)', datum).groups()
            result.append((self._decode(transaction), 
                           self._decode(object_), 
                           payload))
        return result

    def next_transaction(self):
        return self.transaction_offset + len(self.transactions)

    def handle(self, data):
        with self.lock:
            result = []
            transaction_request = None
            for transaction, object_, payload in self.parse(data):
                if object_ is not None:
                    datum = '--t%do%dz%s' % (self.next_transaction(), object_, payload)
                    self.transactions.append(datum)
                    self.objects[object_] = datum

                if transaction is not None:
                    transaction_request = max(transaction_request, transaction)

            if transaction_request is not None:
                if self.transaction_offset <= transaction <= self.next_transaction():
                    result = self.transactions[transaction - self.transaction_offset:]
                else:
                    result = [value for _, value in sorted(self.objects.items())]

            return ''.join(result)

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
    toz = TOZ()

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

    def do_POST(self):
        try:
            result = self.toz.handle(self.rfile.read())
            self.send_response(301)
            self.end_headers()
            self.wfile.write(result)
                
        except Exception, e:
            pass

def main():
    server = HTTPServer(('', 8080), Server)
    try:
        print Server.toz.handle('comment..t0o5zHello,..t0o7zWorld')
        print Server.toz.handle('comment..t1o6zHello,..t2o7zWorld')
        server.serve_forever()
    finally:
        server.socket.close()

if __name__ == '__main__':
    main()
