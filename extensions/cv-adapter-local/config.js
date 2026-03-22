// Configuration for CV Adapter Local extension
// Update BASE_URL to point to your production server

const CONFIG = {
  // Production URL - update this with your deployed server URL
  BASE_URL: 'https://your-production-server.com',

  // API endpoint (relative to BASE_URL)
  get API_BASE() {
    return `${this.BASE_URL}/cv-adapter-api`;
  },
};
