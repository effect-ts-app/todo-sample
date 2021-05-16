const {
  API_HOST: HOST = "127.0.0.1",
  API_PORT,
  AUTH_DISABLED: PROVIDED_AUTH_DISABLED = "false",
  PORT: PROVIDED_PORT = "3330",
} = process.env
const AUTH_DISABLED = PROVIDED_AUTH_DISABLED === "true"

const PORT = API_PORT || PROVIDED_PORT

export { AUTH_DISABLED, PORT, HOST }
