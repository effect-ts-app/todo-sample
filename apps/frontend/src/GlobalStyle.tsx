import { createGlobalStyle } from "styled-components"

const GlobalStyle = createGlobalStyle`
    html, body {
        height: 100%;
    }

    .App {
        display: flex;
    }

    #root, .App {
        height: 100%;
        flex-direction: column;
    }

    #main {
        flex: 1;
        overflow: hidden;
    }

    body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    code {
        font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
        monospace;
    }
`

export default GlobalStyle
