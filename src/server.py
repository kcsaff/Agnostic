
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
from SocketServer import ThreadingMixIn
import os.path
import threading
import re
import cgi
import traceback, sys

class RSBP(object): #Really Simple Bounce Protocol
    SEP = '..'
    transaction_offset = 1
    id_chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    MIN_TRANSACTIONS = 1000
    MAX_TRANSACTIONS = 2000
     
    def __init__(self):
        self.lock = threading.RLock()
        self.objects = {}
        self.transactions = ['..t1d-']
        self.unique_id = 0

    def next_transaction(self):
        return self.transaction_offset + len(self.transactions)
    
    def check_transactions(self):
        if len(self.transactions) > self.MAX_TRANSACTIONS:
            self.transaction_offset += len(self.transactions) - self.MIN_TRANSACTIONS
            self.transactions = self.transactions[-self.MIN_TRANSACTIONS:]
    
    def all_data(self):
        return ''.join([stored for _, stored in sorted(self.objects.values())]) 
    
    def next_unique_id(self):
        self.unique_id += 1
        result = []
        id = self.unique_id
        while id:
            id, char = divmod(id, len(self.id_chars))
            result.append(self.id_chars[char])
        return ''.join(result)

    def handle(self, data):
        print data
        #raw_input()
        with self.lock:
            self.check_transactions()
            for item in data.split(RSBP.SEP)[1:]:
                if item.startswith('d'): #Delete storeD object Data
                    dead = item.split('-',1)[0][1:]
                    for key in list(self.objects.keys()):
                        if key.startswith(dead):
                            del self.objects[key]
                    self.transactions.append('%st%d%s' % (RSBP.SEP, self.next_transaction(), item))
                elif item.startswith('o'): #stOre Object data
                    store = '%st%d%s' % (RSBP.SEP, self.next_transaction(), item)
                    self.objects[item.split('-',1)[0]] = (self.next_transaction(), store)
                    self.transactions.append(store)
                elif item.startswith('t'): #requesT TransacTions since lasT received
                    transaction = int(item[1:])
                    if self.transaction_offset <= transaction:
                        return ''.join(self.transactions[transaction + 1 - self.transaction_offset:])
                    else: #RefResh - Resend all cuRRent object data
                        return self.all_data()
                elif item.startswith('u'): #UniqUe id reqUest
                    return '..u' + self.next_unique_id()
                else:
                    print "Can't handle type %s" % item
                    #raw_input()
            return ''


def to_table(data):
    result = ['<table>']
    for row in data:
        result.append('<tr>')
        for col in row:
            result.append('<td>')
            result.append(str(col))
            result.append('</td>')
        result.append('</tr>')
    result.append('</table>')
    return '\n'.join(result)

def to_html(title, text):
    result = ['<html><head><title>']
    result.append(title)
    result.append('</title></head><body>')
    result.append(str(text))
    result.append('</body></html>')
    return '\n'.join(result)

class FileNotFound(object):
    pass

class Server(BaseHTTPRequestHandler):
    #request_version = "HTTP/1.1"
    paths = {'': '', 
             'js':'js',
             'card': 'card',
             'tarot': 'tarot',
             'pyramid': 'pyramid',
             }
    types = {'.html': 'text/html',
             '.js': 'text/javascript',
             '.png': 'image/png',
             }
    rsbp=RSBP()

    def do_GET(self):
        try:
            path = self.path.lstrip('/.')
            if path in ['o', 't']:
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                if path == 'o':
                    data = self.rsbp.objects.items()
                    title = 'objects'
                elif path == 't':
                    data = enumerate(self.rsbp.transactions)
                    title = 'transactions'
                result = to_html(title, to_table(data))
                if self.request_version == 'HTTP/1.1':
                    self.send_header('Content-length', len(result))
                self.end_headers()
                self.wfile.write(result)
                return
                
            
            path = os.path.join(self.paths[os.path.dirname(path)], os.path.basename(path))
            type_ = os.path.splitext(path)[1]
            if type_ not in self.types:
                raise FileNotFound
            with open(path, 'rb') as f:
                self.send_response(200)
                self.send_header('Content-type', self.types[type_])
                result = f.read()
                if self.request_version == 'HTTP/1.1':
                    self.send_header('Content-length', len(result))
                self.end_headers()
                self.wfile.write(result)
            return
        except Exception, e:
            self.send_error(404, 'File not found: %s, %s' % (self.path, e));

    def do_POST(self):
        try:
            length = cgi.parse_header(self.headers.getheader('content-length'))
            result = self.rsbp.handle(self.rfile.readline().rstrip('\n'))
            #result = self.rsbp.handle(self.rfile.read(int(length[0])))
            self.send_response(200)
            self.send_header('Content-type', 'application/x-www-form-urlencoded')
            if self.request_version == 'HTTP/1.1':
                self.send_header('Content-length', len(result))
            self.end_headers()
            self.wfile.write(result)
                
        except Exception, e:
            print e
            traceback.print_exc(file=sys.stdout)
            pass
        
class MultiThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Multi-threaded server"""

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option('-p', '--port', dest='port',
                      help='serve on PORT', metavar='PORT',
                      default=80)
    parser.add_option('--threaded', dest='threaded',
                      action='store_true',
                      help='run the server in multithreading mode',
                      default=True)
    parser.add_option('--no-threads', dest='threaded',
                      action='store_false',
                      help='run the server in single threaded mode')
    options, args = parser.parse_args()

    ServerClass = {False:HTTPServer, True:MultiThreadedHTTPServer}[options.threaded]
    server = ServerClass(('', options.port), Server)
    try:
        #print Server.rsbp.handle('comment..o5-Hello,..o7-World..r')
        #print Server.rsbp.handle('comment..o7-Monkey..o345-Dog..o7-chicken..t2')
        server.serve_forever()
    finally:
        server.socket.close()
