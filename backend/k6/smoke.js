import http from 'k6/http';
import { check, group, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(95)<2000'],
  },
};

function assertJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export default function runSmoke() {
  group('catalog public', () => {
    const categories = http.get(`${baseUrl}/catalog/categories`);
    check(categories, {
      'categories 200': (r) => r.status === 200,
      'categories json array': (r) => Array.isArray(assertJson(r)),
    });
    const brands = http.get(`${baseUrl}/catalog/brands`);
    check(brands, {
      'brands 200': (r) => r.status === 200,
      'brands json array': (r) => Array.isArray(assertJson(r)),
    });
    const products = http.get(`${baseUrl}/catalog/products?limit=12`);
    check(products, {
      'products 200': (r) => r.status === 200,
      'products has items': (r) => {
        const body = assertJson(r);
        return (
          body !== null &&
          typeof body === 'object' &&
          Array.isArray(body.items)
        );
      },
    });
  });
  sleep(0.2);
  group('orders admin smoke', () => {
    const res = http.get(`${baseUrl}/orders/admin/test`);
    check(res, {
      'orders admin/test 200': (r) => r.status === 200,
      'orders admin/test ok': (r) => {
        const body = assertJson(r);
        return body !== null && body.ok === true;
      },
    });
  });
}
