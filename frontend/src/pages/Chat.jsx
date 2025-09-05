import React, { useEffect, useRef, useState } from "react";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";

const chatModalStyles = {
  position: "fixed",
  top: "5vh",
  right: "20px",
  width: "360px",
  height: "90vh",
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(25px)",
  borderRadius: "20px",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
  overflow: "hidden",
  animation: "slideInFromRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
};

const chatHeaderStyles = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "linear-gradient(to bottom right, #1e1e2f, #2a2e3d)",
  padding: "24px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 4px 20px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
  borderRadius: "20px 20px 0 0",
};

const chatTitleStyles = {
  color: "white",
  fontSize: "20px",
  fontWeight: "600",
  margin: 0,
  textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
};

const messagesContainerStyles = {
  flex: 1,
  overflowY: "auto",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  background: "rgba(248, 249, 250, 0.95)",
  backdropFilter: "blur(10px)",
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
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
};

const userAvatarStyles = {
  ...avatarStyles,
  background: "linear-gradient(135deg, #4caf50, #45a049)",
  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
};

const usernameStyles = {
  marginBottom: "6px",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const messageBubbleStyles = {
  padding: "8px 16px",
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
};

const userMessageStyles = {
  ...messageBubbleStyles,
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  color: "white",
  borderBottomRightRadius: "6px",
  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
};

const otherMessageStyles = {
  ...messageBubbleStyles,
  background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
  color: "#2c3e50",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderBottomLeftRadius: "6px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
};

const messageTextStyles = {
  fontSize: "14px",
  lineHeight: "1.5",
  margin: 0,
  wordWrap: "break-word",
};

const timestampStyles = {
  marginTop: "6px",
  fontSize: "11px",
  color: "#6c757d",
  fontWeight: "500",
};

const emptyStateStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "#6c757d",
  padding: "40px 20px",
};

const emptyIconStyles = {
  width: "64px",
  height: "64px",
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
  boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
};

const inputAreaStyles = {
  background: "white",
  borderTop: "1px solid rgba(0, 0, 0, 0.08)",
  padding: "20px",
  display: "flex",
  gap: "12px",
  alignItems: "flex-end",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
};

const inputContainerStyles = {
  display: "flex",
  alignItems: "flex-end",
  gap: "12px",
};

const textareaStyles = {
  width: "100%",
  padding: "12px 16px",
  background: "rgba(248, 249, 250, 0.8)",
  border: "1px solid rgba(0, 0, 0, 0.1)",
  color: "#2c3e50",
  borderRadius: "25px",
  resize: "none",
  outline: "none",
  minHeight: "44px",
  maxHeight: "120px",
  fontSize: "14px",
  fontFamily: "inherit",
  transition: "all 0.3s ease",
};

const sendButtonStyles = {
  width: "44px",
  height: "44px",
  color: "white",
  border: "none",
  borderRadius: "25px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s ease",
  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
};

export default function ChatModal({
  messages,
  username,
  message,
  setMessage,
  sendMessage,
  onClose,
  socketRef,
  socketIdRef,
}) {
  const messagesEndRef = useRef(null);

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInFromRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes messageSlideIn {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    /* Custom scrollbar for messages container */
    .messages-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .messages-container::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }
    
    .messages-container::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
      border-radius: 3px;
    }
    
    .messages-container::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5));
    }
    
    /* Responsive design */
    @media (max-width: 1200px) {
      .chat-modal {
        width: 320px !important;
      }
    }
    
    @media (max-width: 768px) {
      .chat-modal {
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        left: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        border-radius: 0 !important;
        z-index: 20 !important;
      }
    }
  `;
  
  useEffect(() => {
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={chatModalStyles} className="chat-modal">
      <div style={chatHeaderStyles}>
        <h1 style={chatTitleStyles}>Chat</h1>
        <IconButton onClick={onClose} style={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </div>

      <div style={messagesContainerStyles} className="messages-container">
        {messages.length > 0 ? (
          messages.map((item, index) => {
            const isCurrentUser = item.sender === username;
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                  animation: "messageSlideIn 0.3s ease-out",
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
                      isCurrentUser ? userMessageStyles : otherMessageStyles
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
            <p style={{ fontSize: "18px", fontWeight: "500", margin: 0 }}>
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
        <div ref={messagesEndRef} />
      </div>

      <div style={inputAreaStyles}>
        <div style={inputContainerStyles}>
          <div style={{ flex: 1 }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              style={textareaStyles}
              rows="1"
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.background = "white";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 20px rgba(102, 126, 234, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0, 0, 0, 0.1)";
                e.target.style.background = "rgba(248, 249, 250, 0.8)";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            style={{
              ...sendButtonStyles,
              background: message.trim() 
                ? "linear-gradient(135deg, #667eea, #764ba2)" 
                : "linear-gradient(135deg, #6c757d, #5a6268)",
              cursor: message.trim() ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (message.trim()) {
                e.target.style.background = "linear-gradient(135deg, #5a6fd8, #6a4190)";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = message.trim()
                ? "linear-gradient(135deg, #667eea, #764ba2)"
                : "linear-gradient(135deg, #6c757d, #5a6268)";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
            }}
          >
            <SendIcon style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
