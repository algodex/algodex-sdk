const Logger = {
    shouldEnableLogs: () => {
        if (typeof window != 'undefined') {
            if (window.location.hostname === "localhost") {
                return true;
            }
            const urlParams = new URLSearchParams(window.location.search);
            const enableDebug = urlParams.get('enableDebug') || false;
            return enableDebug != false;
        }
        return true;
    }
}

module.exports = Logger
