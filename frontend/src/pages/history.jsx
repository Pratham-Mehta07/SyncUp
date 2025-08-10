import React from "react";
import { useEffect } from "react";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const history = () => {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);

  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // IMPLEMENT SNACKBAR
      }
    };

    fetchHistory();
  }, []);

  return (
    <div>
      <div>
        {meetings.length > 0 ? (
          meetings.map((meeting, index) => (
            <div key={index} className="meeting-item">
              <p>Meeting Code: {meeting.meetingcode}</p>
            </div>
          ))
        ) : (
          <p>No meeting history found.</p>
        )}
      </div>
      <button onClick={() => routeTo("/home")}>Go to Home</button>
    </div>
  );
};

export default history;
