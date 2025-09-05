import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { IconButton } from "@mui/material";
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
import server from "../environment.js";
import ChatModal from "./Chat.jsx";

const server_url = server;

var connections = {};


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

  let [screenAvailable, setScreenAvailable] = useState();

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);
  const [usernamesMap, setUsernamesMap] = useState({});
  const [leavingPeers, setLeavingPeers] = useState({});

  // Chat state management
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showChat, setShowChat] = useState(false);

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
      const pc = connections[id];
      try {
        const senders = pc.getSenders ? pc.getSenders() : [];
        const hasVideo = senders.some((s) => s.track && s.track.kind === "video");
        const hasAudio = senders.some((s) => s.track && s.track.kind === "audio");
        const vt = window.localStream.getVideoTracks()[0];
        const at = window.localStream.getAudioTracks()[0];
        if (!hasVideo && vt) pc.addTrack(vt, window.localStream);
        if (!hasAudio && at) pc.addTrack(at, window.localStream);
      } catch (e) {}

      pc.createOffer().then((description) => {
        pc
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: pc.localDescription })
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
      const pc = connections[id];
      try {
        const senders = pc.getSenders ? pc.getSenders() : [];
        const hasVideo = senders.some((s) => s.track && s.track.kind === "video");
        const hasAudio = senders.some((s) => s.track && s.track.kind === "audio");
        const vt = window.localStream.getVideoTracks()[0];
        const at = window.localStream.getAudioTracks()[0];
        if (!hasVideo && vt) pc.addTrack(vt, window.localStream);
        if (!hasAudio && at) pc.addTrack(at, window.localStream);
      } catch (e) {}

      pc.createOffer().then((description) => {
        pc
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: pc.localDescription })
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
      socketRef.current.emit("join-call", window.location.href, username);
      socketIdRef.current = socketRef.current.id;


      socketRef.current.on("user-left", (id) => {
        // Mark tile as leaving (black overlay)
        setLeavingPeers((prev) => ({ ...prev, [id]: true }));
        // Close and remove RTCPeerConnection if exists
        try {
          if (connections[id]) {
            connections[id].onaddstream = null;
            connections[id].onicecandidate = null;
            connections[id].oniceconnectionstatechange = null;
            connections[id].close();
            delete connections[id];
          }
        } catch (e) {
          console.log(e);
        }

        // Remove after a short delay to show black overlay immediately
        setTimeout(() => {
          setVideos((prev) => {
            const filtered = prev.filter((video) => video.socketId !== id);
            videoRef.current = filtered;
            return filtered;
          });
          setUsernamesMap((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setLeavingPeers((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, 500);
      });

      // Chat message listener
      socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
        // Only add message if it's not from the current user (to avoid duplicates)
        if (socketIdSender !== socketIdRef.current) {
          const messageData = {
            sender: sender,
            data: data,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, messageData]);
        }
      });

      socketRef.current.on("user-joined", (id, clients, roomUsernames) => {
        if (roomUsernames && typeof roomUsernames === "object") {
          setUsernamesMap(roomUsernames);
        }
        clients.forEach((socketListId) => {
          if (connections[socketListId]) {
            return; // Avoid creating duplicate peer connections
          }
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
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

          // Auto-cleanup on connection state change
          connections[socketListId].oniceconnectionstatechange = () => {
            const state = connections[socketListId].iceConnectionState;
            if (state === "disconnected" || state === "failed" || state === "closed") {
              // Mark as leaving (black overlay) immediately
              setLeavingPeers((prev) => ({ ...prev, [socketListId]: true }));
              try {
                if (connections[socketListId]) {
                  connections[socketListId].onaddstream = null;
                  connections[socketListId].onicecandidate = null;
                  connections[socketListId].oniceconnectionstatechange = null;
                  connections[socketListId].close();
                  delete connections[socketListId];
                }
              } catch (e) {
                console.log(e);
              }
              setTimeout(() => {
                setVideos((prev) => {
                  const filtered = prev.filter((v) => v.socketId !== socketListId);
                  videoRef.current = filtered;
                  return filtered;
                });
                setUsernamesMap((prev) => {
                  const next = { ...prev };
                  delete next[socketListId];
                  return next;
                });
                setLeavingPeers((prev) => {
                  const next = { ...prev };
                  delete next[socketListId];
                  return next;
                });
              }, 500);
            }
          };

          // Unified modern ontrack handler (replaces onaddstream usage)
          connections[socketListId].ontrack = (event) => {
            const [stream] = event.streams;
            const track = event.track;

            const removeTile = () => {
              setLeavingPeers((prev) => ({ ...prev, [socketListId]: true }));
              setTimeout(() => {
                setVideos((prev) => {
                  const filtered = prev.filter((v) => v.socketId !== socketListId);
                  videoRef.current = filtered;
                  return filtered;
                });
                setUsernamesMap((prev) => {
                  const next = { ...prev };
                  delete next[socketListId];
                  return next;
                });
                setLeavingPeers((prev) => {
                  const next = { ...prev };
                  delete next[socketListId];
                  return next;
                });
              }, 500);
            };
            if (track && track.addEventListener) {
              track.addEventListener("ended", removeTile, { once: true });
            }

            const existing = videoRef.current.find((v) => v.socketId === socketListId);
            if (existing) {
              setVideos((prev) => {
                const updated = prev.map((v) =>
                  v.socketId === socketListId ? { ...v, stream: stream } : v
                );
                videoRef.current = updated;
                return updated;
              });
            } else {
              const newVideo = {
                socketId: socketListId,
                stream: stream,
                autoplay: true,
                playsinline: true,
              };
              setVideos((prev) => {
                // Ensure uniqueness by socketId before adding
                const withoutDup = prev.filter((v) => v.socketId !== socketListId);
                const updated = [...withoutDup, newVideo];
                videoRef.current = updated;
                return updated;
              });
            }
          };

          // Add local tracks via addTrack
          const ensureLocalStream = () => {
            if (window.localStream !== undefined && window.localStream !== null) {
              return window.localStream;
            }
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            return window.localStream;
          };
          const ls = ensureLocalStream();
          try {
            const pc = connections[socketListId];
            const senders = pc.getSenders ? pc.getSenders() : [];
            const hasVideo = senders.some((s) => s.track && s.track.kind === "video");
            const hasAudio = senders.some((s) => s.track && s.track.kind === "audio");
            const vt = ls.getVideoTracks()[0];
            const at = ls.getAudioTracks()[0];
            if (!hasVideo && vt) pc.addTrack(vt, ls);
            if (!hasAudio && at) pc.addTrack(at, ls);
          } catch (e) {}
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            if (!connections[id2]) continue; // Skip if not initialized

            try {
              const pc = connections[id2];
              const ls = window.localStream;
              if (ls && pc) {
                const senders = pc.getSenders ? pc.getSenders() : [];
                const hasVideo = senders.some((s) => s.track && s.track.kind === "video");
                const hasAudio = senders.some((s) => s.track && s.track.kind === "audio");
                const vt = ls.getVideoTracks()[0];
                const at = ls.getAudioTracks()[0];
                if (!hasVideo && vt) pc.addTrack(vt, ls);
                if (!hasAudio && at) pc.addTrack(at, ls);
              }
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

  // Create a black video track that is enabled, so receivers immediately render black
  let createBlackVideoTrack = ({ width = 640, height = 480 } = {}) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    const stream = canvas.captureStream(10);
    const track = stream.getVideoTracks()[0];
    track.enabled = true; // ensure black frames are sent
    return track;
  };

  let handleVideo = async () => {
    const turningOff = video === true;
    setVideo(!video);

    try {
      if (turningOff) {
        // Replace outgoing video track with an enabled black track so remotes see black instantly
        const blackTrack = createBlackVideoTrack();

        // Update local stream
        try {
          const currentStream = localVideoref.current?.srcObject;
          if (currentStream) {
            currentStream.getVideoTracks().forEach((t) => t.stop());
          }
        } catch {}

        const newLocalStream = new MediaStream([
          blackTrack,
          ...(window.localStream?.getAudioTracks() || []),
        ]);
        window.localStream = newLocalStream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = newLocalStream;
        }

        // Replace on all senders; fallback to re-addStream + renegotiate
        for (let id in connections) {
          const pc = connections[id];
          if (!pc) continue;
          const senders = pc.getSenders ? pc.getSenders() : [];
          const videoSender = senders.find(
            (s) => s.track && s.track.kind === "video"
          );
          if (videoSender && videoSender.replaceTrack) {
            await videoSender.replaceTrack(blackTrack);
          } else {
            try {
              if (pc.getLocalStreams) {
                pc.getLocalStreams().forEach((s) => pc.removeStream(s));
              }
            } catch {}
            try {
              pc.addStream(window.localStream);
            } catch {}
            try {
              const description = await pc.createOffer();
              await pc.setLocalDescription(description);
              socketRef.current.emit(
                "signal",
                id,
                JSON.stringify({ sdp: pc.localDescription })
              );
            } catch (e) {
              console.log(e);
            }
          }
        }
      } else {
        // Turning on: reacquire camera video track and replace
        const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const cameraTrack = media.getVideoTracks()[0];

        // Update local stream: keep existing audio track if present
        const newLocalStream = new MediaStream([
          cameraTrack,
          ...(window.localStream?.getAudioTracks() || []),
        ]);
        window.localStream = newLocalStream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = newLocalStream;
        }

        // Replace on all senders; fallback to re-addStream + renegotiate
        for (let id in connections) {
          const pc = connections[id];
          if (!pc) continue;
          const senders = pc.getSenders ? pc.getSenders() : [];
          const videoSender = senders.find(
            (s) => s.track && s.track.kind === "video"
          );
          if (videoSender && videoSender.replaceTrack) {
            await videoSender.replaceTrack(cameraTrack);
          } else {
            try {
              if (pc.getLocalStreams) {
                pc.getLocalStreams().forEach((s) => pc.removeStream(s));
              }
            } catch {}
            try {
              pc.addStream(window.localStream);
            } catch {}
            try {
              const description = await pc.createOffer();
              await pc.setLocalDescription(description);
              socketRef.current.emit(
                "signal",
                id,
                JSON.stringify({ sdp: pc.localDescription })
              );
            } catch (e) {
              console.log(e);
            }
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
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


  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  // Chat functions
  const sendMessage = () => {
    if (message.trim() && socketRef.current) {
      const messageData = {
        sender: username,
        data: message.trim(),
        timestamp: new Date(),
      };
      
      // Add message to local state
      setMessages(prev => [...prev, messageData]);
      
      // Emit message to other participants (backend expects data, sender format)
      socketRef.current.emit("chat-message", message.trim(), username);
      
      // Clear input
      setMessage("");
    }
  };

  const toggleChat = () => {
    setShowChat(!showChat);
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

            <IconButton onClick={toggleChat} style={{ color: "white" }}>
              <ChatIcon />
            </IconButton>

          </div>

          <div className={styles.localVideoWrapper}>
            <video
              ref={localVideoref}
              autoPlay
              muted
            ></video>
            <div className={styles.nameLabel}>{username || "You"}</div>
          </div>

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
                {leavingPeers[video.socketId] && (
                  <div className={styles.leavingOverlay}></div>
                )}
                <div className={styles.nameLabel}>
                  {usernamesMap[video.socketId]
                    ? usernamesMap[video.socketId]
                    : `User-${String(video.socketId).slice(0, 5)}`}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Modal */}
          {showChat && (
            <ChatModal
              messages={messages}
              username={username}
              message={message}
              setMessage={setMessage}
              sendMessage={sendMessage}
              onClose={() => setShowChat(false)}
              socketRef={socketRef}
              socketIdRef={socketIdRef}
            />
          )}
        </div>
      )}
    </div>
  );
}
