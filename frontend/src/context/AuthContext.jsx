import { Children, createContext, useContext, useState } from "react";
import axios from "axios";
import httpstatus from "http-status";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/user",
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);

  const [userData, setUserData] = useState(authContext);

  const handleRegister = async (name, username, password) => {
    try {
      let request = await client.post("/register", {
        name: name,
        username: username,
        password: password,
      });

      if (request.status === httpstatus.CREATED) {
        console.log(request.data.message);
        return request.data.message;
      } else {
        return request.status;
      }
    } catch (e) {
      throw e;
      // console.log(e.response.data.message);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      let request = await client.post("/login", {
        username: username,
        password: password,
      });
      if (request.status === httpstatus.OK) {
        return localStorage.setItem("token", request.data.token);
      }
    } catch (err) {
      throw err;
    }
  };

  const router = useNavigate();

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
