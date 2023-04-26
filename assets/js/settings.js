/** MODIFY BELOW BEFORE DEPLOYMENT (don't change the names!!) **/

/* Definition of the domains of the application */
const SELF_DOMAIN = null;
const API_DOMAIN = null;
const WEBSOCKET_DOMAIN = null;

if (SELF_DOMAIN === null || API_DOMAIN === null || WEBSOCKET_DOMAIN === null) {
    alert("Please configure the domains in assets/js/settings.js before deployment.");
}

/** MODIFY ABOVE BEFORE DEPLOYMENT **/

/** DO NOT MODIFY THE CODE BELOW IF YOU HAVEN'T CHANGED THE DEFAULT VERSION **/

/* Define user interface pages */
const HOME = SELF_DOMAIN + 'index.html';
const NEW_MODEL = SELF_DOMAIN + 'new-model.html';

/* Define API endpoints */
const API_ENDPOINTS = {
    "settings": {
        "get": {
            "url": API_DOMAIN+"/settings",
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
        "url": API_DOMAIN+"/model/",
        "method": "POST"
      },
      "update": {
        "url": API_DOMAIN+"/model/",
        "method": "PUT"
      },
      "exists": {
        "url": API_DOMAIN+"/model/modelNameTaken/",
        "method": "GET"
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
const ERROR_SERVER = SELF_DOMAIN + 'error-pages/server-error.html';