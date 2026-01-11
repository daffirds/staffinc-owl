import https from 'https';
import http from 'http';

class HttpService {
  private apiUrl: string;

  constructor() {
    const apiGatewayId = process.env.API_GATEWAY_ID || '0uygfnbbo2';
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';
    
    this.apiUrl = `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/Prod`;
    console.log('[HTTP Service] Initialized with URL:', this.apiUrl);
    
    if (!this.apiUrl) {
      throw new Error('Failed to construct API Gateway URL');
    }
  }

  async post<T>(path: string, body: any): Promise<T> {
    const url = new URL(path, this.apiUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 600000,
      };

      console.log('[HTTP Service] Calling:', this.apiUrl + path);

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log('[HTTP Service] Response:', res.statusCode, data.substring(0, 200));
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('[HTTP Service] Error:', error);
        reject(error);
      });

      req.on('timeout', () => {
        console.error('[HTTP Service] Timeout');
        req.destroy();
        reject(new Error('Request timeout after 10 minutes'));
      });

      req.write(postData);
      req.end();
    });
  }
}

export const httpService = new HttpService();
