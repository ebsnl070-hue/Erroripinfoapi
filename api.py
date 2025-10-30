from http.server import BaseHTTPRequestHandler
import json
import requests
import socket
from datetime import datetime
from urllib.parse import urlparse, parse_qs

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse URL and query parameters
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            
            # Get IP from query parameter
            ip_address = query_params.get('ip', [None])[0]
            
            # Alternative: Get IP from path /?ip=XXX.XXX.XXX.XXX
            if not ip_address:
                if 'ip=' in self.path:
                    ip_address = self.path.split('ip=')[-1].split('&')[0]
            
            if not ip_address:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    "success": False,
                    "error": "Please provide an IP address",
                    "usage": "Add ?ip=8.8.8.8 to your URL",
                    "example": "https://your-app.vercel.app/api?ip=8.8.8.8"
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Validate IP address
            try:
                socket.inet_aton(ip_address)
            except socket.error:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "Invalid IP address format"
                }).encode())
                return
            
            # Get IP information
            ip_info = self.get_ip_info(ip_address)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(ip_info, indent=2).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {
                "success": False,
                "error": "Internal server error",
                "message": str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())

    def get_ip_info(self, ip_address):
        """Get comprehensive information about an IP address"""
        ip_info = {
            "ip": ip_address,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "success": True
        }
        
        try:
            # Get data from ipapi.co
            response = requests.get(f"http://ipapi.co/{ip_address}/json/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                # Basic information
                ip_info.update({
                    "ip": data.get("ip", ip_address),
                    "version": "IPv4" if "." in ip_address else "IPv6",
                    "city": data.get("city"),
                    "region": data.get("region"),
                    "region_code": data.get("region_code"),
                    "country": data.get("country_name"),
                    "country_code": data.get("country_code"),
                    "continent_code": data.get("continent_code"),
                    "postal_code": data.get("postal"),
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude"),
                    "timezone": data.get("timezone"),
                    "utc_offset": data.get("utc_offset"),
                    "country_calling_code": data.get("country_calling_code"),
                    "currency": data.get("currency"),
                    "currency_name": data.get("currency_name"),
                    "languages": data.get("languages"),
                    "asn": data.get("asn"),
                    "org": data.get("org"),
                    "isp": data.get("org"),
                    "hostname": data.get("hostname", "Not available")
                })
                
            # Get additional security info from ipwhois
            security_response = requests.get(f"http://ipwho.is/{ip_address}", timeout=10)
            if security_response.status_code == 200:
                security_data = security_response.json()
                if security_data.get("success"):
                    ip_info.update({
                        "security": {
                            "proxy": security_data.get("security", {}).get("proxy", False),
                            "vpn": security_data.get("security", {}).get("vpn", False),
                            "tor": security_data.get("security", {}).get("tor", False),
                            "relay": security_data.get("security", {}).get("relay", False)
                        },
                        "connection_type": security_data.get("type", "Unknown"),
                        "continent": security_data.get("continent", "Unknown"),
                        "flag": {
                            "emoji": security_data.get("flag", {}).get("emoji", ""),
                            "unicode": security_data.get("flag", {}).get("unicode", "")
                        }
                    })
                    
        except requests.exceptions.Timeout:
            ip_info.update({
                "success": False,
                "error": "Request timeout - service unavailable"
            })
        except Exception as e:
            ip_info.update({
                "success": False,
                "error": f"Failed to fetch IP information: {str(e)}"
            })
        
        return ip_info

    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# Vercel requirement
def app(environ, start_response):
    return Handler(environ, start_response)
