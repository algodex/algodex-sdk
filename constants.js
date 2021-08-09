/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////


module.exports = {
    DEBUG: 1,
    DEBUG_SMART_CONTRACT_SOURCE: ("DEBUG_SMART_CONTRACT_SOURCE" in process.env) ? parseInt(process.env.DEBUG_SMART_CONTRACT_SOURCE) : 0,
    INFO_SERVER: process.env.ALGODEX_INFO_HOST,

    ESCROW_CONTRACT_VERSION: 3,
    ORDERBOOK_CONTRACT_VERSION: 3,
    MIN_ESCROW_BALANCE: 500000,
    MIN_ASA_ESCROW_BALANCE: 500000,

    LOCAL_ALGOD_SERVER:  ("ALGODEX_ALGOD_SERVER" in process.env) ? process.env.ALGODEX_ALGOD_SERVER : "https://testnet.algoexplorerapi.io",
    LOCAL_ALGOD_PORT: ("ALGODEX_ALGOD_PORT" in process.env) ? process.env.ALGODEX_ALGOD_PORT : "",
    LOCAL_ALGOD_TOKEN: ("ALGODEX_ALGOD_TOKEN" in process.env) ? process.env.ALGODEX_ALGOD_TOKEN : "",
	LOCAL_BACKEND_API: "http://localhost/algodex-backend",
    LOCAL_INDEXER_SERVER: "https://testnet.algoexplorerapi.io/idx2",
    LOCAL_INDEXER_PORT: "",
    LOCAL_INDEXER_TOKEN: "",
    //intentionally same as test, assuming testnet being used on local setup
    LOCAL_ALGO_ORDERBOOK_APPID: 18988007,
    LOCAL_ASA_ORDERBOOK_APPID: 18988134,
        //const indexer_server = "http://localhost";
        //const indexer_port = "8980";

    TEST_ALGOD_SERVER:  ("ALGODEX_ALGOD_SERVER" in process.env) ? process.env.ALGODEX_ALGOD_SERVER : "https://testnet.algoexplorerapi.io",
    TEST_ALGOD_PORT: ("ALGODEX_ALGOD_PORT" in process.env) ? process.env.ALGODEX_ALGOD_PORT : "",
    TEST_ALGOD_TOKEN: ("ALGODEX_ALGOD_TOKEN" in process.env) ? process.env.ALGODEX_ALGOD_TOKEN : "",
	TEST_BACKEND_API: "https://api-testnet.algodex.com/algodex-backend",
    TEST_INDEXER_SERVER: "https://testnet.algoexplorerapi.io/idx2",
    TEST_INDEXER_PORT: "",
    TEST_INDEXER_TOKEN: "",
    TEST_ALGO_ORDERBOOK_APPID: 16021155,
    TEST_ASA_ORDERBOOK_APPID: 16021157,


    PROD_ALGOD_SERVER: "https://algoexplorerapi.io",
    PROD_ALGOD_PORT: "",
    PROD_ALGOD_TOKEN: "",
	PROD_BACKEND_API: "",
    PROD_INDEXER_SERVER: "https://algoexplorerapi.io/idx2",
    PROD_INDEXER_PORT: "",
    PROD_INDEXER_TOKEN: "",
    PROD_ALGO_ORDERBOOK_APPID: -1, //FIXME ONCE CREATED
    PROD_ASA_ORDERBOOK_APPID: -1, //FIXME ONCE CREATED
};