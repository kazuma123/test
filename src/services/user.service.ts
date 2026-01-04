// services/user.service.ts
import axios from 'axios';

const BASE_URL = 'https://geolocalizacion-backend-wtnq.onrender.com';

export async function fetchUserById(userId: number) {
  const { data } = await axios.get(`${BASE_URL}/usuarios/${userId}`, {
    timeout: 15000,
  });
  return data;
}
