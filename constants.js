module.exports = {
    DEBUG: 1,
    DEBUG_SMART_CONTRACT_SOURCE: 1,

    MIN_ESCROW_BALANCE: 310000,
    MIN_ASA_ESCROW_BALANCE: 360000,

    LOCAL_ALGOD_SERVER: "http://192.168.1.211",
    LOCAL_ALGOD_PORT: 4001,
    LOCAL_ALGOD_TOKEN: "68ea2562459dec26bcebd43c426625cc3ba02707abcb34d3e278eecd7fbde7c3",
    LOCAL_INDEXER_SERVER: "https://testnet.algoexplorerapi.io/idx2",
    LOCAL_INDEXER_PORT: "",
    LOCAL_INDEXER_TOKEN: "",
    //intentionally same as test, assuming testnet being used on local setup
    LOCAL_ALGO_ORDERBOOK_APPID: 16021155,
    LOCAL_ASA_ORDERBOOK_APPID: 16021157, 
        //const indexer_server = "http://localhost";
        //const indexer_port = "8980";

    TEST_ALGOD_SERVER: "https://testnet.algoexplorerapi.io",
    TEST_ALGOD_PORT: "",
    TEST_ALGOD_TOKEN: "",
    TEST_INDEXER_SERVER: "https://testnet.algoexplorerapi.io/idx2",
    TEST_INDEXER_PORT: "",
    TEST_INDEXER_TOKEN: "",
    TEST_ALGO_ORDERBOOK_APPID: 16021155,
    TEST_ASA_ORDERBOOK_APPID: 16021157,


    PROD_ALGOD_SERVER: "https://algoexplorerapi.io",
    PROD_ALGOD_PORT: "",
    PROD_ALGOD_TOKEN: "",
    PROD_INDEXER_SERVER: "https://algoexplorerapi.io/idx2",
    PROD_INDEXER_PORT: "",
    PROD_INDEXER_TOKEN: "",
    PROD_ALGO_ORDERBOOK_APPID: -1, //FIXME ONCE CREATED
    PROD_ASA_ORDERBOOK_APPID: -1, //FIXME ONCE CREATED
};