import React from "react";

const new_meeting_preview = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#060714] to-[#0F101A] px-4">
      <h2 className="text-3xl font-bold text-white mb-6">Enter into Lobby</h2>

      <div className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#1a1b2f] text-white placeholder-gray-400 border border-[#22c55e40] focus:outline-none focus:ring-2 focus:ring-[#22c55e] transition"
        />

        <button
          onClick={() => {
            if (username.trim() === "") {
              alert("Please enter a username");
            } else {
              connect();
            }
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#15803d] text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition"
        >
          Start Meeting
        </button>

        <div className="mt-6 rounded-xl overflow-hidden border border-[#22c55e30] shadow-md">
          <video
            ref={localVideoref}
            autoPlay
            muted
            className="w-full h-auto rounded-xl"
          ></video>
        </div>
      </div>
    </div>
  );
};

export default new_meeting_preview;
