import { Children, createContext, useContext, useState } from "react";
import axios from "axios";
import httpstatus from "http-status";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: server + "/api/v1/user",
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);

  const [userData, setUserData] = useState(authContext);

  const router = useNavigate();

  const handleRegister = async (name, username, email, password) => {
    try {
      let request = await client.post("/register", {
        name: name,
        username: username,
        email: email,
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
    }
  };

  const handleLogin = async (username, password) => {
    try {
      let request = await client.post("/login", {
        username: username,
        password: password,
      });
      if (request.status === httpstatus.OK) {
        localStorage.setItem("token", request.data.token);
        localStorage.setItem("isLoggedIn", "true");
        router("/");
      }
    } catch (err) {
      throw err;
    }
  };

  const getHistoryOfUser = async () => {
    try {
      let request = await client.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token"),
        },
      });
      return request.data;
    } catch {
      throw new Error("Error fetching user history");
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      let request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request;
    } catch {
      throw new Error("Error adding to user history");
    }
  };

  const data = {
    userData,
    setUserData,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
    addToUserHistory,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
