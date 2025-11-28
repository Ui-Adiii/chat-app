import axios from 'axios';

const apiUrl = `${import.meta.env.VITE_API_URL}/api`

const axiosInstance = axios.create({
    baseURL:apiUrl,
    withCredentials:true,
    secure: true,              // must be TRUE on vercel/render (HTTPS)
    sameSite: "none", 
})
export default axiosInstance