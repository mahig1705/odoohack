import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const signup = async (email: string, password: string) => {
  const res = await API.post("/auth/signup", { email, password });
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await API.post("/auth/login", { email, password });
  return res.data;
};
