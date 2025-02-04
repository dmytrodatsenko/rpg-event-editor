from http.server import HTTPServer, SimpleHTTPRequestHandler
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import threading
import time
import subprocess
import os
import sys
import platform

PORT = 8000
clients = []

def find_npm():
    """Find npm executable path based on OS"""
    if platform.system() == "Windows":
        # Common npm installation paths on Windows
        possible_paths = [
            os.path.join(os.environ.get('APPDATA', ''), 'npm', 'npm.cmd'),
            os.path.join(os.environ.get('PROGRAMFILES', ''), 'nodejs', 'npm.cmd'),
            os.path.join(os.environ.get('PROGRAMFILES(X86)', ''), 'nodejs', 'npm.cmd'),
            # Add npm from Git Bash if installed
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Programs', 'nodejs', 'npm.cmd')
        ]
        
        # Also check PATH directories
        if 'PATH' in os.environ:
            for path_dir in os.environ['PATH'].split(os.pathsep):
                possible_paths.append(os.path.join(path_dir, 'npm.cmd'))
        
        for path in possible_paths:
            if os.path.isfile(path):
                return path
                
        return 'npm.cmd'  # Default to npm.cmd if not found in common locations
    else:
        return 'npm'  # For Unix-based systems

class MyHandler(FileSystemEventHandler):
    def __init__(self):
        self.build_lock = threading.Lock()
        self.last_build_time = 0
        self.build_cooldown = 2  # Minimum seconds between builds
        self.npm_path = find_npm()

    def run_build(self):
        current_time = time.time()
        
        with self.build_lock:
            if current_time - self.last_build_time < self.build_cooldown:
                return
            
            self.last_build_time = current_time
            
            print("\nRunning npm build...")
            try:
                shell = platform.system() == "Windows"  # Use shell=True on Windows
                
                # Run npm build command
                process = subprocess.Popen(
                    [self.npm_path, 'run', 'build'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    shell=shell,  # Important for Windows
                    env=os.environ.copy()  # Use current environment variables
                )
                
                # Get output in real-time
                while True:
                    output = process.stdout.readline()
                    if output:
                        print(output.strip())
                    elif process.poll() is not None:
                        break
                
                # Check for any errors
                if process.returncode != 0:
                    print("Build failed with error:")
                    print(process.stderr.read())
                else:
                    print("Build completed successfully")
                
            except Exception as e:
                print(f"Error running build: {str(e)}")

    def on_modified(self, event):
        if event.src_path.endswith(('.js', '.ts', '.jsx', '.tsx', '.css', '.scss')):
            print(f"\nFile {event.src_path} has been modified")
            
            # Run build in a separate thread to avoid blocking
            build_thread = threading.Thread(target=self.run_build)
            build_thread.start()
            
            # Notify all connected clients
            for client in clients[:]:
                try:
                    client.write(b"data: reload\n\n")
                    client.flush()
                except:
                    clients.remove(client)

class ReloadHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/changes':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()
            
            clients.append(self.wfile)
            try:
                while True:
                    time.sleep(30)  # Send ping every 30 seconds
                    try:
                        self.wfile.write(b": ping\n\n")
                        self.wfile.flush()
                    except:
                        break
            finally:
                if self.wfile in clients:
                    clients.remove(self.wfile)
        else:
            return super().do_GET()

def run_server():
    server = HTTPServer(('', PORT), ReloadHandler)
    print(f"Serving at port {PORT}")
    server.serve_forever()

if __name__ == "__main__":
    npm_path = find_npm()
    
    # Verify npm is installed
    try:
        subprocess.run([npm_path, '--version'], 
                      capture_output=True, 
                      check=True, 
                      shell=platform.system() == "Windows")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: npm command not found. Please verify that:")
        print("1. Node.js and npm are installed")
        print("2. npm is added to your system's PATH")
        print(f"Current PATH: {os.environ.get('PATH', '')}")
        sys.exit(1)

    # Verify package.json exists
    if not os.path.exists('package.json'):
        print("Error: package.json not found in current directory")
        sys.exit(1)

    # Start the server in a separate thread
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()

    # Set up the watchdog observer
    event_handler = MyHandler()
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=True)
    observer.start()

    # Add client-side script to HTML files
    html_script = """
    <script>
        const evtSource = new EventSource('/changes');
        evtSource.onmessage = function(event) {
            if (event.data === 'reload') {
                window.location.reload();
            }
        };
        evtSource.onerror = function() {
            // Try to reconnect after a delay if connection is lost
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        };
    </script>
    """

    print("Live reload server running. Add this script to your HTML files:")
    print(html_script)
    print("\nWatching for file changes...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\nStopping server...")
    
    observer.join()