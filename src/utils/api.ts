import axios from 'axios';
const apiUrl = import.meta.env.VITE_SOCKET_SERVER_URL;
const handleAxiosError = (error: unknown)=> {
  // Use the built-in isAxiosError type guard
  if (axios.isAxiosError(error)) {
    console.error('API Error Status:', error.response?.status);
    console.error('API Error Data:', error.response?.data);
  } else {
    console.error('Unexpected Error:', error);
  }
}

export  const getLatestStockPrice= async(): Promise<any>=> {
  try {
    // Pass the type <User> to type-annotate the response data
    const response = await axios.get<any>(`${apiUrl}/data/data_latest.json`);
    
    // response.data is automatically typed as User
    return response.data; 
  } catch (error) {
    handleAxiosError(error);
    throw error;
  }
}