const AUTH = "/auth";
const CHAT = "/chat";
const STATUS = "/status";

// Auth endpoints
export const SEND_OTP_URL = `${AUTH}/send-otp`;
export const VERIFY_OTP_URL = `${AUTH}/verify-otp`;
export const UPDATE_PROFILE_URL = `${AUTH}/update-profile`;
export const LOGOUT_URL = `${AUTH}/logout`;
export const CHECK_AUTH_URL = `${AUTH}/check-auth`;
export const GET_ALL_USER_URL = `${AUTH}/get-all-users`;

// Chat endpoints
export const GET_CONVERSATIONS_URL = `${CHAT}/conversations`;
export const GET_MESSAGES_URL = `${CHAT}/conversations`;
export const SEND_MESSAGE_URL = `${CHAT}/send-message`;
export const MARK_AS_READ_URL = `${CHAT}/message/read`;
export const DELETE_MESSAGE_URL = `${CHAT}/message`;

// Status endpoints
export const CREATE_STATUS_URL = `${STATUS}/create-status`;
export const GET_STATUSES_URL = `${STATUS}/get-statuses`;
export const VIEW_STATUS_URL = `${STATUS}`;
export const DELETE_STATUS_URL = `${STATUS}`;
