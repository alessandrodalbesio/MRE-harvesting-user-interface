/* Definition of the domains of the application */
const SELF_DOMAIN = "http://virtualenv.epfl.ch/";
const API_DOMAIN = "http://virtualenv.epfl.ch/api";
const WEBSOCKET_DOMAIN = "http://virtualenv.epfl.ch/ws";
const WEBSOCKET_PATH = "/ws";
const WEBSOCKET_DOMAIN_API = "http://virtualenv.epfl.ch/ws/endpoints";

/* Define user interface pages */
const HOME = SELF_DOMAIN + 'index.html';
const NEW_MODEL = SELF_DOMAIN + 'new-model.html';

/* Define API endpoints */
const API_ENDPOINTS = {
    "settings": {
        "get": {
            "url": API_DOMAIN+"/settings",
            "method": "GET"
        },
        "ip": {
            "url": API_DOMAIN+"/ip",
            "method": "GET"
        }
    },
    "model": {
      "list": {
        "url": API_DOMAIN+"/models",
        "method": "GET"
      },
      "delete": {
        "url": API_DOMAIN+"/model/",
        "method": "DELETE"
      },
      "create": {
        "url": API_DOMAIN+"/model",
        "method": "POST"
      },
      "update": {
        "url": API_DOMAIN+"/model/",
        "method": "PUT"
      },
      "exists": {
        "url": API_DOMAIN+"/model/modelNameTaken/",
        "method": "GET"
      },
      "get": {
        "url": API_DOMAIN+"/model/modelID/",
        "method": "GET"
      },
      "lock": {
        "url": WEBSOCKET_DOMAIN_API+"/lock-model",
        "method": "POST"
      },
      "unlock": {
        "url": WEBSOCKET_DOMAIN_API+"/unlock-model",
        "method": "POST"
      }
    },
    "texture": {
      "delete": {
        "url": API_DOMAIN+"/texture/",
        "method": "DELETE"
      },
      "create": {
        "url": API_DOMAIN+"/texture/",
        "method": "POST"
      },
      "setDefault": {
        "url": API_DOMAIN+"/texture/default/",
        "method": "PUT"
      }
    }
  };

/* Define error pages URLS */
const DEVICE_IS_SMALL = SELF_DOMAIN + 'error-pages/device-is-small.html';
const MODEL_NOT_FOUND = SELF_DOMAIN + 'error-pages/model-not-found.html';
const NOT_COMPATIBLE = SELF_DOMAIN + 'error-pages/not-compatible.html';
const NO_JS = SELF_DOMAIN + 'error-pages/no-js.html';
const ERROR_SERVER = SELF_DOMAIN + 'error-pages/500.html';