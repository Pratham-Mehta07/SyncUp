import React, { useEffect, useRef, useState } from "react";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";

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
    <div style={chatModalStyles}>
      <div style={chatHeaderStyles}>
        <h1 style={chatTitleStyles}>Chat</h1>
        <IconButton onClick={onClose} style={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </div>

      <div style={messagesContainerStyles}>
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
              if (message.trim()) e.target.style.backgroundColor = "#2563eb";
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
  );
}
