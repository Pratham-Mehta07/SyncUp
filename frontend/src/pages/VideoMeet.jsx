import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { IconButton } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../Styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import PeopleIcon from "@mui/icons-material/People";
import { Clock, Calendar, Video } from "lucide-react";
import server from "../environment.js";
import ChatModal from "./Chat.jsx";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

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

  // New states for Roles and Lobby
  const [role, setRole] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingGuests, setWaitingGuests] = useState([]);
  const [meetingEnded, setMeetingEnded] = useState(false);

  // New states for Participant List
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);

  // Screen sharing presentation mode: tracks who is sharing ('local' or a socketId)
  const [screenSharer, setScreenSharer] = useState(null);

  // New states for Dynamic Lobby
  const { userData } = useContext(AuthContext);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [checkingRoom, setCheckingRoom] = useState(true);

  // Time state for the Lobby
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let timer;
    if (askForUsername) {
      timer = setInterval(() => setCurrentTime(new Date()), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [askForUsername]);

  // TODO
  // if(isChrome() === false) {

  // }

  useEffect(() => {
    console.log("HELLO");
    
    // Check if room exists before requesting permissions
    const tempSocket = io.connect(server_url, { secure: false });
    tempSocket.emit("check-room", window.location.href);
    
    tempSocket.on("room-status", ({ exists }) => {
      console.log("Room exists?", exists);
      if (!exists) {
        // Room doesn't exist -> This user is the creator (Host)
        setIsRoomCreator(true);
      } else {
        // Room exists -> This user is joining as a Member
        setIsRoomCreator(false);
      }
      
      // Inherit name from Session Storage if logged in (for both Hosts and Members)
      const storedName = sessionStorage.getItem("username");
      if (storedName) {
        setUsername(storedName);
      }

      setCheckingRoom(false);
      tempSocket.disconnect();
      getPermissions();
    });
    
  }, [userData]);

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

  let getUserMediaSuccess = async (stream) => {
    // Simplified renegotiation - only for existing connections
for (let id in connections) {
  if (id === socketIdRef.current) continue;
  const pc = connections[id];
  if (!pc) continue;
  
  try {
    // Simple track replacement without complex checking
    const senders = pc.getSenders();
    const videoSender = senders.find(s => s.track && s.track.kind === "video");
    const audioSender = senders.find(s => s.track && s.track.kind === "audio");
    
    const videoTrack = window.localStream.getVideoTracks()[0];
    const audioTrack = window.localStream.getAudioTracks()[0];
    
    if (videoSender && videoTrack) {
      await videoSender.replaceTrack(videoTrack);
    }
    if (audioSender && audioTrack) {
      await audioSender.replaceTrack(audioTrack);
    }
  } catch (e) {
    console.log("Error updating tracks for connection:", id, e);
  }
}
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
      if (!pc) continue;

      try {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === "video");
        const videoTrack = window.localStream.getVideoTracks()[0];

        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack).catch(e => console.log("Error replacing screen track:", e));
        }
      } catch (e) {
        console.log("Error updating screen track for connection:", id, e);
      }
    }

    stream.getVideoTracks()[0].onended = () => {
      setScreen(false);
      
      // Notify peers that screen sharing stopped
      if (socketRef.current) {
        socketRef.current.emit("screen-share-status", false);
      }
      setScreenSharer(prev => prev === 'local' ? null : prev);

      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {
        console.log(e);
      }

      // Revert back to the user's camera
      getUserMedia();
    };
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        const pc = connections[fromId];
        if (!pc) {
          console.log("No peer connection found for:", fromId);
          return;
        }

        // Check current signaling state before setting remote description
        const currentState = pc.signalingState;
        console.log(`Current signaling state for ${fromId}:`, currentState);
        
        // Only set remote description if we're in a valid state
        if (currentState === "stable" || currentState === "have-local-offer") {
          console.log(`Setting remote description for ${fromId}, type:`, signal.sdp.type);
          
          pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
            .then(() => {
              console.log(`Remote description set successfully for ${fromId}`);
              
              if (signal.sdp.type === "offer") {
                console.log(`Creating answer for ${fromId}`);
                pc.createAnswer()
                  .then((description) => {
                    pc.setLocalDescription(description)
                      .then(() => {
                        console.log(`Local description set for ${fromId}, sending answer`);
                        socketRef.current.emit(
                          "signal",
                          fromId,
                          JSON.stringify({
                            sdp: pc.localDescription,
                          })
                        );
                      })
                      .catch((e) => console.log(`Error setting local description for ${fromId}:`, e));
                  })
                  .catch((e) => console.log(`Error creating answer for ${fromId}:`, e));
              }
            })
            .catch((e) => {
              console.log(`Error setting remote description for ${fromId}:`, e);
              // If we get an InvalidStateError, try to reset the connection state
              if (e.name === "InvalidStateError") {
                console.log(`InvalidStateError for ${fromId}, attempting to reset connection`);
                // Don't try to set remote description again, just log the error
              }
            });
        } else {
          console.log(`Skipping remote description for ${fromId}, invalid state:`, currentState);
        }
      }

      if (signal.ice) {
        const pc = connections[fromId];
        if (pc) {
          pc.addIceCandidate(new RTCIceCandidate(signal.ice))
            .catch((e) => console.log(`Error adding ICE candidate for ${fromId}:`, e));
        }
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href, username);
      socketIdRef.current = socketRef.current.id;

      // Request initial list of participants
      socketRef.current.emit("request-participants", window.location.href);

      socketRef.current.on("participants-update", (updatedParticipants) => {
        console.log("Received updated participants list:", updatedParticipants);
        setParticipants(updatedParticipants);
      });

      socketRef.current.on("role", (assignedRole) => {
        console.log(`Assigned role: ${assignedRole}`);
        setRole(assignedRole);
        setIsWaiting(false); // If they get a role, they're no longer waiting
      });

      socketRef.current.on("waiting-for-host", () => {
        setIsWaiting(true);
      });

      socketRef.current.on("guest-waiting", (guest) => {
        // Notification to the Host
        setWaitingGuests((prev) => {
          // Check if already in array
          if (prev.find((g) => g.socketId === guest.socketId)) return prev;
          return [...prev, guest];
        });
      });

      socketRef.current.on("join-denied", () => {
        alert("The host has denied your request to join the meeting.");
        window.location.href = "/";
      });

      socketRef.current.on("meeting-ended", () => {
        console.log("Meeting ended by Host");
        setMeetingEnded(true);
        // Clean up connections if they exist
        try {
          for (let id in connections) {
            connections[id].close();
          }
          let tracks = localVideoref.current?.srcObject?.getTracks();
          tracks?.forEach((track) => track.stop());
        } catch (e) {
          console.log(e);
        }
      });

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

      // Screen share status listener (from remote peers)
      socketRef.current.on("screen-share-status", ({ peerId, isSharing }) => {
        console.log(`Screen share status: ${peerId} is ${isSharing ? 'sharing' : 'not sharing'}`);
        if (isSharing) {
          setScreenSharer(peerId);
        } else {
          setScreenSharer(prev => prev === peerId ? null : prev);
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
    const canvas = document.createElement('canvas');
  const stream = canvas.captureStream();
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  const track = destination.stream.getAudioTracks()[0];
  track.enabled = false;
  return track;
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
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    const stream = canvas.captureStream(1); // 1 FPS is sufficient for black video
    const track = stream.getVideoTracks()[0];
    track.enabled = true; // Ensure it's enabled
    return track;
  };

  // Helper function to ensure proper audio track replacement
  const replaceAudioTrackForConnection = async (pc, newTrack, connectionId) => {
    try {
      const senders = pc.getSenders ? pc.getSenders() : [];
      const audioSender = senders.find(
        (s) => s.track && s.track.kind === "audio"
      );
      
      if (audioSender && audioSender.replaceTrack) {
        console.log(`Replacing audio track for connection: ${connectionId}`);
        console.log(`Current signaling state:`, pc.signalingState);
        
        // Ensure the new track is enabled
        newTrack.enabled = true;
        
        await audioSender.replaceTrack(newTrack);
        console.log(`Audio track replaced successfully for: ${connectionId}`);
        
        // Check if we're in a stable state before creating offer
        if (pc.signalingState === "stable") {
          console.log(`Creating offer for audio track replacement: ${connectionId}`);
          const description = await pc.createOffer();
          await pc.setLocalDescription(description);
          socketRef.current.emit(
            "signal",
            connectionId,
            JSON.stringify({ sdp: pc.localDescription })
          );
          console.log(`Successfully replaced and renegotiated audio for: ${connectionId}`);
        } else {
          console.log(`Skipping offer creation for audio ${connectionId}, signaling state:`, pc.signalingState);
        }
        return true;
      } else {
        console.log(`No audio sender found for connection: ${connectionId}, using fallback`);
        return false;
      }
    } catch (e) {
      console.log(`Error replacing audio track for connection: ${connectionId}`, e);
      return false;
    }
  };

  // Helper function to ensure proper video track replacement
  const replaceVideoTrackForConnection = async (pc, newTrack, connectionId) => {
    try {
      const senders = pc.getSenders ? pc.getSenders() : [];
      const videoSender = senders.find(
        (s) => s.track && s.track.kind === "video"
      );
      
      if (videoSender && videoSender.replaceTrack) {
        console.log(`Replacing video track for connection: ${connectionId}`);
        console.log(`Old track:`, videoSender.track);
        console.log(`New track:`, newTrack);
        console.log(`Current signaling state:`, pc.signalingState);
        
        // Ensure the new track is enabled
        newTrack.enabled = true;
        
        await videoSender.replaceTrack(newTrack);
        console.log(`Track replaced successfully for: ${connectionId}`);
        
        // Check if we're in a stable state before creating offer
        if (pc.signalingState === "stable") {
          console.log(`Creating offer for track replacement: ${connectionId}`);
          const description = await pc.createOffer();
          await pc.setLocalDescription(description);
          socketRef.current.emit(
            "signal",
            connectionId,
            JSON.stringify({ sdp: pc.localDescription })
          );
          console.log(`Successfully replaced and renegotiated video for: ${connectionId}`);
        } else {
          console.log(`Skipping offer creation for ${connectionId}, signaling state:`, pc.signalingState);
        }
        return true;
      } else {
        console.log(`No video sender found for connection: ${connectionId}, using fallback`);
        return false;
      }
    } catch (e) {
      console.log(`Error replacing video track for connection: ${connectionId}`, e);
      return false;
    }
  };

  let handleVideo = async () => {
    const newVideoState = !video;
    setVideo(newVideoState);
  
    try {
      if (!newVideoState) {
        // Turning video OFF - replace with black track
        console.log("Turning video off...");
        
        // Stop current video tracks
        if (window.localStream) {
          window.localStream.getVideoTracks().forEach(track => {
            track.stop();
            console.log("Stopped video track:", track.id);
          });
        }
  
        // Create black track
        const blackTrack = createBlackVideoTrack();
        
        // Update local stream
        const audioTracks = window.localStream ? window.localStream.getAudioTracks() : [];
        window.localStream = new MediaStream([blackTrack, ...audioTracks]);
        
        if (localVideoref.current) {
          localVideoref.current.srcObject = window.localStream;
        }
  
        // Update all peer connections
        for (let id in connections) {
          const pc = connections[id];
          if (!pc) continue;
  
          try {
            const senders = pc.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === "video");
            
            if (videoSender) {
              await videoSender.replaceTrack(blackTrack);
              console.log(`Replaced video with black track for: ${id}`);
            }
          } catch (e) {
            console.log(`Error replacing video track for ${id}:`, e);
          }
        }
  
      } else {
        // Turning video ON - get camera stream
        console.log("Turning video on...");
        
        try {
          // Get fresh camera stream
          const videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            }
          });
          
          const cameraTrack = videoStream.getVideoTracks()[0];
          if (!cameraTrack) {
            throw new Error("No camera track available");
          }
  
          console.log("Got camera track:", cameraTrack.id);
  
          // Update local stream
          const audioTracks = window.localStream ? window.localStream.getAudioTracks() : [];
          
          // Stop old video tracks
          if (window.localStream) {
            window.localStream.getVideoTracks().forEach(track => track.stop());
          }
          
          window.localStream = new MediaStream([cameraTrack, ...audioTracks]);
          
          if (localVideoref.current) {
            localVideoref.current.srcObject = window.localStream;
          }
  
          // Update all peer connections with delay between each
          const connectionIds = Object.keys(connections);
          for (let i = 0; i < connectionIds.length; i++) {
            const id = connectionIds[i];
            const pc = connections[id];
            if (!pc) continue;
  
            try {
              const senders = pc.getSenders();
              const videoSender = senders.find(s => s.track && s.track.kind === "video");
              
              if (videoSender) {
                await videoSender.replaceTrack(cameraTrack);
                console.log(`Replaced black track with camera for: ${id}`);
              }
              
              // Small delay between connections
              if (i < connectionIds.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } catch (e) {
              console.log(`Error replacing track for ${id}:`, e);
            }
          }
  
        } catch (error) {
          console.error("Failed to get camera stream:", error);
          setVideo(false); // Revert state on failure
          alert("Could not access camera. Please check permissions.");
          return;
        }
      }
  
    } catch (e) {
      console.error("Error in handleVideo:", e);
      setVideo(!newVideoState); // Revert state on error
    }
  };
  let handleAudio = async () => {
    const turningOff = audio === true;
    setAudio(!audio);

    try {
      if (turningOff) {
        // Turning audio off: replace with silence track
        console.log("Turning audio off...");
        
        // Create a silence audio track
        const silenceTrack = silence();
        
        // Update local stream: keep existing video track if present
        const videoTracks = window.localStream ? window.localStream.getVideoTracks() : [];
        const newLocalStream = new MediaStream([...videoTracks, silenceTrack]);
        window.localStream = newLocalStream;
        
        if (localVideoref.current) {
          localVideoref.current.srcObject = newLocalStream;
        }

        // Replace audio tracks on all peer connections
        for (let id in connections) {
          const pc = connections[id];
          if (!pc) continue;
          
          try {
            await replaceAudioTrackForConnection(pc, silenceTrack, id);
          } catch (e) {
            console.log(`Error turning off audio for connection: ${id}`, e);
          }
        }
        
      } else {
        // Turning audio on: reacquire microphone
        console.log("Turning audio back on...");
        
        try {
          // Get new microphone stream
          const media = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }, 
            video: false 
          });
          
          const audioTrack = media.getAudioTracks()[0];
          console.log("Got new audio track:", audioTrack);

          // Update local stream: keep existing video track if present
          const videoTracks = window.localStream ? window.localStream.getVideoTracks() : [];
          const newLocalStream = new MediaStream([...videoTracks, audioTrack]);
          window.localStream = newLocalStream;
          
          if (localVideoref.current) {
            localVideoref.current.srcObject = newLocalStream;
          }

          // Replace audio tracks on all peer connections
          for (let id in connections) {
            const pc = connections[id];
            if (!pc) continue;
            
            try {
              await replaceAudioTrackForConnection(pc, audioTrack, id);
            } catch (e) {
              console.log(`Error turning on audio for connection: ${id}`, e);
            }
          }
          
          console.log("Audio turn-on process completed successfully");
          
        } catch (error) {
          console.error("Error turning audio back on:", error);
          // Revert the audio state if there was an error
          setAudio(false);
          throw error;
        }
      }
    } catch (e) {
      console.log("Error in handleAudio:", e);
      // Revert the audio state if there was an error
      setAudio(turningOff);
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);
  let handleScreen = () => {
    const newScreenState = !screen;
    setScreen(newScreenState);
    
    // Notify peers about screen share status
    if (socketRef.current) {
      socketRef.current.emit("screen-share-status", newScreenState);
    }
    
    // Update local presentation mode
    if (newScreenState) {
      setScreenSharer('local');
    } else {
      setScreenSharer(prev => prev === 'local' ? null : prev);
    }
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/";
  };

  const handleAdmitGuest = (socketId, admit) => {
    if (socketRef.current) {
      const roomPath = window.location.href;
      socketRef.current.emit("admit-guest", roomPath, socketId, admit);
      // Remove from UI list
      setWaitingGuests((prev) => prev.filter((g) => g.socketId !== socketId));
    }
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

  // --- Helper: determine grid class from participant count ---
  const getGridClass = (count) => {
    if (count <= 1) return 'grid1';
    if (count === 2) return 'grid2';
    if (count === 3) return 'grid3';
    if (count === 4) return 'grid4';
    if (count <= 6) return 'grid6';
    if (count <= 9) return 'grid9';
    return 'gridMany';
  };

  // --- Meeting Timer Component ---
  const MeetingTimer = () => {
    const [elapsed, setElapsed] = useState(0);
    const startTime = useRef(Date.now());

    useEffect(() => {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    const formatElapsed = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return `${m}:${String(s).padStart(2, '0')}`;
    };

    return (
      <div className={styles.meetingTimer}>
        <div className={styles.meetingTimerDot}></div>
        <span className={styles.meetingTimerText}>{formatElapsed(elapsed)}</span>
      </div>
    );
  };

  return (
    <div>
      {checkingRoom ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#060714] to-[#0F101A] px-4 text-center">
           <h2 className="text-3xl font-bold text-white mb-4 animate-pulse">Checking Meeting Details...</h2>
        </div>
      ) : askForUsername === true ? (
        <div className="flex flex-col lg:flex-row min-h-screen bg-black text-white relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#060714] via-[#0a0a1a] to-[#0F101A] z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-900/20 via-[#060714]/0 to-transparent z-0" />
          
          {/* Left Side: Video Preview & Time */}
          <div className="relative z-10 flex-[1.5] w-full p-6 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5">
            {/* Header / Logo */}
            <div className="flex items-center space-x-3 mb-8 lg:mb-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                SyncUp
              </h1>
            </div>

            {/* Video Box */}
            <div className="w-full max-w-2xl mx-auto mt-4 lg:mt-0 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-video shadow-2xl flex items-center justify-center">
                
                {/* Video / Avatar Fallback */}
                {video ? (
                  <video
                    ref={localVideoref}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  ></video>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
                      <VideocamOffIcon sx={{ fontSize: 40, color: "gray" }} />
                    </div>
                    <p className="text-gray-400">Camera is off</p>
                  </div>
                )}
                
                {/* Overlay Name */}
                {username && (
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-sm font-medium z-10">
                    {username}
                  </div>
                )}

                {/* Pre-join AV Controls */}
                <div className="absolute bottom-4 right-4 flex space-x-3 z-10">
                  <div className="bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                    <IconButton onClick={handleAudio} size="small" style={{ color: audio ? "white" : "#ef4444", padding: "8px" }}>
                      {audio ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                    </IconButton>
                  </div>
                  <div className="bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                    <IconButton onClick={handleVideo} size="small" style={{ color: video ? "white" : "#ef4444", padding: "8px" }}>
                      {video ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                    </IconButton>
                  </div>
                </div>

              </div>
            </div>

            {/* Date & Time display */}
            <div className="hidden lg:flex flex-col space-y-2 mt-8">
              <div className="text-6xl font-light tracking-tight text-white/90">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xl text-gray-400 font-medium">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Right Side: Meeting Details & Join Controls */}
          <div className="relative z-10 flex-1 w-full bg-black/40 backdrop-blur-3xl p-6 lg:p-12 flex flex-col justify-center items-center">
            
            {/* Mobile Date & Time (Only shows on small screens) */}
            <div className="flex lg:hidden flex-col items-center space-y-1 mb-10 w-full">
              <div className="text-5xl font-light tracking-tight text-white/90">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-lg text-gray-400 font-medium">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div className="w-full max-w-sm space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-white">
                  Ready to join?
                </h2>
                <p className="text-gray-400">
                  {isRoomCreator 
                    ? "You are about to start a new meeting." 
                    : "You are joining an existing meeting."}
                </p>
              </div>

              <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                {!(sessionStorage.getItem("isLoggedIn") === "true" && sessionStorage.getItem("username")) ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 ml-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-black/50 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 ml-1">Joining as</label>
                    <div className="bg-black/40 border border-green-500/20 rounded-xl px-4 py-3.5 flex items-center justify-between">
                      <span className="text-white font-medium">{username}</span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full uppercase tracking-wider">
                        {isRoomCreator ? "Host" : "Member"}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (username.trim() === "") {
                      alert("Please enter a username");
                    } else {
                      connect();
                    }
                  }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
                >
                  <span className="relative z-10 text-lg">
                    {isRoomCreator ? "Start Meeting" : "Join Meeting"}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : meetingEnded ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F101A] px-4 text-center">
          <h2 className="text-4xl font-bold text-red-500 mb-4">Meeting Ended</h2>
          <p className="text-gray-300 mb-8 text-lg">The host has ended this meeting.</p>
          <button
            onClick={() => window.location.href = "/"}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold shadow-lg hover:scale-105 transition"
          >
            Return to Home
          </button>
        </div>
      ) : isWaiting ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F101A] px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 animate-pulse">Waiting for Host...</h2>
          <p className="text-gray-400 text-lg">Please wait, the meeting host will let you in soon.</p>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>

          {/* Meeting Timer (top-left) */}
          <MeetingTimer />

          {/* Main Layout Area */}
          {screenSharer ? (
            <div className={`${styles.presentationLayout} ${(showChat || showParticipants) ? styles.withSidePanel : ''}`}>
              {/* Main Presentation Area */}
              <div className={styles.presentationMain}>
                {screenSharer === 'local' ? (
                  <div className={`${styles.videoTile} ${styles.localTile}`}>
                    <video
                      ref={(ref) => {
                        localVideoref.current = ref;
                        if (ref && window.localStream && ref.srcObject !== window.localStream) {
                          ref.srcObject = window.localStream;
                        }
                      }}
                      autoPlay
                      muted
                      className={screen ? "" : styles.localVideo}
                    ></video>
                    <div className={styles.tileNameLabel}>
                      <span>{username || "You"} (Presenting)</span>
                      <span className={styles.micIndicator}>
                        {audio ? <MicIcon style={{ fontSize: 14, color: '#e8eaed' }} /> : <MicOffIcon style={{ fontSize: 14, color: '#ea4335' }} />}
                      </span>
                    </div>
                  </div>
                ) : (
                  videos.filter(v => v.socketId === screenSharer).map(v => (
                    <div key={`main-${v.socketId}`} className={styles.videoTile}>
                      <video
                        data-socket={v.socketId}
                        ref={(ref) => {
                          if (ref && v.stream && ref.srcObject !== v.stream) {
                            ref.srcObject = v.stream;
                          }
                        }}
                        autoPlay
                      ></video>
                      <div className={styles.tileNameLabel}>
                        <span>
                          {usernamesMap[v.socketId]
                            ? usernamesMap[v.socketId]
                            : `User-${String(v.socketId).slice(0, 5)}`} (Presenting)
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Sidebar Area */}
              <div className={styles.presentationSidebar}>
                {screenSharer !== 'local' && (
                  <div className={`${styles.videoTile} ${styles.localTile}`}>
                    {video ? (
                      <video
                        ref={(ref) => {
                          localVideoref.current = ref;
                          if (ref && window.localStream && ref.srcObject !== window.localStream) {
                            ref.srcObject = window.localStream;
                          }
                        }}
                        autoPlay
                        muted
                        className={styles.localVideo}
                      ></video>
                    ) : (
                      <div className={styles.avatarFallback}>
                        <div className={`${styles.avatarCircle} ${styles.avatarColor0}`}>
                          {(username || "Y").charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div className={styles.tileNameLabel}>
                      <span>{username || "You"}</span>
                      <span className={styles.micIndicator}>
                        {audio ? <MicIcon style={{ fontSize: 14, color: '#e8eaed' }} /> : <MicOffIcon style={{ fontSize: 14, color: '#ea4335' }} />}
                      </span>
                    </div>
                  </div>
                )}
                {videos.filter(v => v.socketId !== screenSharer).map((v, idx) => (
                  <div key={v.socketId} className={styles.videoTile}>
                    <video
                      data-socket={v.socketId}
                      ref={(ref) => {
                        if (ref && v.stream && ref.srcObject !== v.stream) {
                          ref.srcObject = v.stream;
                        }
                      }}
                      autoPlay
                    ></video>
                    {leavingPeers[v.socketId] && (
                      <div className={styles.leavingOverlay}></div>
                    )}
                    <div className={styles.tileNameLabel}>
                      <span>
                        {usernamesMap[v.socketId]
                          ? usernamesMap[v.socketId]
                          : `User-${String(v.socketId).slice(0, 5)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`${styles.videoGridArea} ${(showChat || showParticipants) ? styles.withSidePanel : ''}`}>
              <div className={`${styles.videoGrid} ${styles[getGridClass(videos.length + 1)]}`}>
                
                {/* Local User Tile */}
                <div className={`${styles.videoTile} ${styles.localTile}`}>
                  {video ? (
                    <video
                      ref={(ref) => {
                        localVideoref.current = ref;
                        if (ref && window.localStream && ref.srcObject !== window.localStream) {
                          ref.srcObject = window.localStream;
                        }
                      }}
                      autoPlay
                      muted
                      className={styles.localVideo}
                    ></video>
                  ) : (
                    <div className={styles.avatarFallback}>
                      <div className={`${styles.avatarCircle} ${styles.avatarColor0}`}>
                        {(username || "Y").charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className={styles.tileNameLabel}>
                    <span>{username || "You"} (You)</span>
                    <span className={styles.micIndicator}>
                      {audio ? <MicIcon style={{ fontSize: 14, color: '#e8eaed' }} /> : <MicOffIcon style={{ fontSize: 14, color: '#ea4335' }} />}
                    </span>
                  </div>
                </div>

                {/* Remote Participant Tiles */}
                {videos.map((v, idx) => (
                  <div key={v.socketId} className={`${styles.videoTile}`}>
                    <video
                      data-socket={v.socketId}
                      ref={(ref) => {
                        if (ref && v.stream && ref.srcObject !== v.stream) {
                          ref.srcObject = v.stream;
                        }
                      }}
                      autoPlay
                    ></video>
                    {leavingPeers[v.socketId] && (
                      <div className={styles.leavingOverlay}></div>
                    )}
                    <div className={styles.tileNameLabel}>
                      <span>
                        {usernamesMap[v.socketId]
                          ? usernamesMap[v.socketId]
                          : `User-${String(v.socketId).slice(0, 5)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- Control Bar (original SyncUp glassmorphism style) ---- */}
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

            <IconButton onClick={() => setShowParticipants(!showParticipants)} style={{ color: "white" }}>
              <PeopleIcon />
            </IconButton>
          </div>

          {/* ---- Chat Side Panel ---- */}
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

          {/* ---- Participants Side Panel ---- */}
          {showParticipants && (
            <div className={styles.sidePanel}>
              <div className={styles.sidePanelHeader}>
                <span className={styles.sidePanelTitle}>People ({participants.length || videos.length + 1})</span>
                <button className={styles.sidePanelClose} onClick={() => setShowParticipants(false)}>
                  ✕
                </button>
              </div>
              <div className={styles.sidePanelBody}>
                {/* Current user always shown first */}
                <div className={styles.participantItem}>
                  <div className={`${styles.participantAvatar} ${styles.avatarColor0}`}>
                    {(username || "Y").charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.participantInfo}>
                    <div className={styles.participantName}>
                      {username || "You"}
                      <span className={styles.participantYouTag}>(You)</span>
                    </div>
                    <div className={styles.participantRole}>{role || "Participant"}</div>
                  </div>
                </div>

                {participants.length > 0 ? (
                  participants
                    .filter(p => p.socketId !== socketIdRef.current)
                    .map((p, idx) => (
                      <div key={p.socketId} className={styles.participantItem}>
                        <div className={`${styles.participantAvatar} ${styles[`avatarColor${(idx + 1) % 8}`]}`}>
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.participantInfo}>
                          <div className={styles.participantName}>{p.username}</div>
                          <div className={styles.participantRole}>{p.role}</div>
                        </div>
                      </div>
                    ))
                ) : (
                  videos.map((v, idx) => (
                    <div key={v.socketId} className={styles.participantItem}>
                      <div className={`${styles.participantAvatar} ${styles[`avatarColor${(idx + 1) % 8}`]}`}>
                        {(usernamesMap[v.socketId] || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.participantInfo}>
                        <div className={styles.participantName}>
                          {usernamesMap[v.socketId] || `User-${String(v.socketId).slice(0, 5)}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ---- Host Admission Toasts ---- */}
          {role === "Host" && waitingGuests.length > 0 && (
            <div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 30 }}>
              {waitingGuests.map((guest) => (
                <div key={guest.socketId} className={styles.admissionToast} style={{ position: 'relative', transform: 'none', left: 'auto', bottom: 'auto' }}>
                  <span className={styles.admissionToastText}>
                    <strong>{guest.username}</strong> wants to join
                  </span>
                  <button className={`${styles.admissionBtn} ${styles.admitBtn}`} onClick={() => handleAdmitGuest(guest.socketId, true)}>
                    Admit
                  </button>
                  <button className={`${styles.admissionBtn} ${styles.denyBtn}`} onClick={() => handleAdmitGuest(guest.socketId, false)}>
                    Deny
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
