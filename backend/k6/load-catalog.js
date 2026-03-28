import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 20 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

const paths = [
  () => `${baseUrl}/catalog/categories`,
  () => `${baseUrl}/catalog/brands`,
  () => `${baseUrl}/catalog/products?limit=24`,
];

export default function runLoad() {
  const pick = paths[Math.floor(Math.random() * paths.length)];
  const url = pick();
  const res = http.get(url);
  const ok = check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });
  if (!ok) {
    console.error(`Request failed: ${url} -> ${res.status} ${String(res.body).slice(0, 200)}`);
  }
  sleep(Math.random() * 0.5 + 0.1);
}
