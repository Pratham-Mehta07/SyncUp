import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../Styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import server from "../environment.js";
import CloseIcon from "@mui/icons-material/Close";

const server_url = server;

var connections = {};

// Move all styles outside component to prevent re-renders
const chatModalStyles = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "50vh",
  height: "100vh",
  backgroundColor: "#1f2937",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  borderLeft: "1px solid #374151",
};

const chatHeaderStyles = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#374151",
  padding: "16px 24px",
  borderBottom: "1px solid #4b5563",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const chatTitleStyles = {
  color: "white",
  fontSize: "20px",
  fontWeight: "600",
  margin: 0,
};

const messagesContainerStyles = {
  flex: 1,
  overflowY: "auto",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const avatarStyles = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const botAvatarStyles = {
  ...avatarStyles,
  backgroundColor: "#3b82f6",
};

const userAvatarStyles = {
  ...avatarStyles,
  backgroundColor: "#4b5563",
};

const usernameStyles = {
  marginBottom: "4px",
  fontSize: "12px",
  fontWeight: "500",
};

const messageBubbleStyles = {
  padding: "8px 16px",
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
};

const userMessageStyles = {
  ...messageBubbleStyles,
  backgroundColor: "#3b82f6",
  color: "white",
  borderBottomRightRadius: "4px",
};

const otherMessageStyles = {
  ...messageBubbleStyles,
  backgroundColor: "#374151",
  color: "#f3f4f6",
  border: "1px solid #4b5563",
  borderBottomLeftRadius: "4px",
};

const messageTextStyles = {
  fontSize: "14px",
  lineHeight: "1.4",
  margin: 0,
};

const timestampStyles = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#9ca3af",
};

const emptyStateStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "#9ca3af",
};

const emptyIconStyles = {
  width: "64px",
  height: "64px",
  backgroundColor: "#374151",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

const inputAreaStyles = {
  backgroundColor: "#374151",
  borderTop: "1px solid #4b5563",
  padding: "16px",
};

const inputContainerStyles = {
  display: "flex",
  alignItems: "flex-end",
  gap: "12px",
};

const textareaStyles = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#374151",
  border: "1px solid #4b5563",
  color: "#f3f4f6",
  borderRadius: "12px",
  resize: "none",
  outline: "none",
  minHeight: "44px",
  maxHeight: "120px",
  fontSize: "14px",
  fontFamily: "inherit",
};

const sendButtonStyles = {
  width: "44px",
  height: "44px",
  color: "white",
  border: "none",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 0.2s",
};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(false);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(0);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  // TODO
  // if(isChrome() === false) {

  // }

  useEffect(() => {
    console.log("HELLO");
    getPermissions();
  }, []);

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("Video permission granted");
      } else {
        setVideoAvailable(false);
        console.log("Video permission denied");
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio permission denied");
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("SET STATE HAS ", video, audio);
    }
  }, [video, audio]);
  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        })
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  let getDislayMediaSuccess = (stream) => {
    console.log("HERE");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        })
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socketListId);

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              console.log("FOUND EXISTING");

              // Update the stream of the existing video
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              // Create a new video
              console.log("CREATING NEW");
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    setVideo(!video);
    // getUserMedia();
  };
  let handleAudio = () => {
    setAudio(!audio);
    // getUserMedia();
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);
  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/";
  };

  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data, timestamp: new Date() },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    if (message.trim()) {
      console.log(socketRef.current);
      socketRef.current.emit("chat-message", message, username);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername === true ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#060714] to-[#0F101A] px-4">
          <h2 className="text-3xl font-bold text-white mb-6">
            Enter into Lobby
          </h2>

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
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div style={chatModalStyles}>
              {/* Professional Chat Header */}
              <div style={chatHeaderStyles}>
                <h1 style={chatTitleStyles}>Chat</h1>
                <CloseIcon onClick={closeChat} style={{ cursor: "pointer" }} />
              </div>

              {/* Messages Container */}
              <div style={messagesContainerStyles}>
                {messages.length !== 0 ? (
                  messages.map((item, index) => {
                    const isCurrentUser = item.sender === username;
                    return (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          justifyContent: isCurrentUser
                            ? "flex-end"
                            : "flex-start",
                        }}
                      >
                        {!isCurrentUser && (
                          <div style={botAvatarStyles}>
                            <SmartToyIcon
                              style={{
                                width: "16px",
                                height: "16px",
                                color: "white",
                              }}
                            />
                          </div>
                        )}

                        <div
                          style={{
                            maxWidth: "280px",
                            order: isCurrentUser ? 1 : 2,
                          }}
                        >
                          <div
                            style={{
                              ...usernameStyles,
                              textAlign: isCurrentUser ? "right" : "left",
                              color: isCurrentUser ? "#d1d5db" : "#9ca3af",
                            }}
                          >
                            {item.sender}
                          </div>

                          <div
                            style={
                              isCurrentUser
                                ? userMessageStyles
                                : otherMessageStyles
                            }
                          >
                            <p style={messageTextStyles}>{item.data}</p>
                          </div>

                          <div
                            style={{
                              ...timestampStyles,
                              textAlign: isCurrentUser ? "right" : "left",
                            }}
                          >
                            {item.timestamp ? formatTime(item.timestamp) : ""}
                          </div>
                        </div>

                        {isCurrentUser && (
                          <div style={{ ...userAvatarStyles, order: 2 }}>
                            <PersonIcon
                              style={{
                                width: "16px",
                                height: "16px",
                                color: "#d1d5db",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={emptyStateStyles}>
                    <div style={emptyIconStyles}>
                      <SmartToyIcon
                        style={{
                          width: "32px",
                          height: "32px",
                          color: "#6b7280",
                        }}
                      />
                    </div>
                    <p
                      style={{ fontSize: "18px", fontWeight: "500", margin: 0 }}
                    >
                      No messages yet
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        marginTop: "4px",
                        margin: 0,
                      }}
                    >
                      Start a conversation to get started
                    </p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div style={inputAreaStyles}>
                <div style={inputContainerStyles}>
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      style={textareaStyles}
                      rows="1"
                      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                      onBlur={(e) => (e.target.style.borderColor = "#4b5563")}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    style={{
                      ...sendButtonStyles,
                      backgroundColor: message.trim() ? "#3b82f6" : "#6b7280",
                      cursor: message.trim() ? "pointer" : "not-allowed",
                    }}
                    onMouseEnter={(e) => {
                      if (message.trim())
                        e.target.style.backgroundColor = "#2563eb";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = message.trim()
                        ? "#3b82f6"
                        : "#6b7280";
                    }}
                  >
                    <SendIcon style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge
              badgeContent={newMessages}
              max={999}
              style={{ color: "white" }}
            >
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: "white" }}
              >
                <ChatIcon />{" "}
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoref}
            autoPlay
            muted
          ></video>

          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
