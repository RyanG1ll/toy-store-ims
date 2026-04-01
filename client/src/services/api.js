import axios from 'axios';

// Create an instance of axios with a base URL for the API
// This allows us to easily make requests to our backend without repeating the base URL
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

export default api;