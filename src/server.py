
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import os.path
import threading
import re
import cgi
import traceback, sys

class RSBP(object):
    SEP = '..'
    objects = {}
    transactions = []
    transaction_offset = 1
    
    def __init__(self):
        self.lock = threading.RLock()

    def next_transaction(self):
        return self.transaction_offset + len(self.transactions)

    def handle(self, data):
        print data
        with self.lock:
            transaction_request = None
            for item in data.split(RSBP.SEP)[1:]:
                if item.startswith('o'):
                    name, payload = item[1:].split('-', 1)
                    store = '%st%do%s-%s' % (RSBP.SEP, self.next_transaction(), name, payload)
                    self.objects[name] = (self.next_transaction(), store)
                    self.transactions.append(store)
                elif item.startswith('t'):
                    request = int(item[1:])
                    return ''.join(self.transactions[request + 1 - self.transaction_offset:])
                elif item.startswith('r'):
                    objects = sorted([v for v in self.objects.values()])
                    return ''.join([stored for i, stored in objects]) 
            else:
                return ''


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
    rsbp=RSBP()

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
            length = cgi.parse_header(self.headers.getheader('content-length'))
            #print length[0]
            result = self.rsbp.handle(self.rfile.read(int(length[0])))
            self.send_response(200)
            self.send_header('Content-type', 'application/x-www-form-urlencoded')
            self.end_headers()
            self.wfile.write(result)
                
        except Exception, e:
            print e
            traceback.print_exc(file=sys.stdout)
            pass

def main():
    server = HTTPServer(('', 8080), Server)
    try:
        print Server.rsbp.handle('comment..o5-Hello,..o7-World..r')
        print Server.rsbp.handle('comment..o7-Monkey..o345-Dog..o7-chicken..t2')
        server.serve_forever()
    finally:
        server.socket.close()

if __name__ == '__main__':
    main()
