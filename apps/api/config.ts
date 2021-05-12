const {
  API_HOST: HOST = "127.0.0.1",
  API_PORT: PORT = "3330",
  AUTH_DISABLED: PROVIDED_AUTH_DISABLED = "false",
} = process.env
const AUTH_DISABLED = PROVIDED_AUTH_DISABLED === "true"

export { AUTH_DISABLED, PORT, HOST }
