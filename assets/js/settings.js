/* Function to save errors in cache */
function saveError(errorText) {
  const timeNow = new Date(Date.now()).toLocaleString();
  const page_name = window.location.pathname.split("/").pop();
  errorText = timeNow + " - " + errorText + " - " + page_name;
  const error = sessionStorage.getItem("error");
  if(error !== null)
    sessionStorage.setItem("error", error + "\n" + errorText);
  else
  sessionStorage.setItem("error", errorText);
}

/* Get the settings */
let SELF_DOMAIN = null;
let API_DOMAIN = null;
let MODELS_FOLDER = null;
let WEBSOCKET_DOMAIN = null;
$.ajax({
    'async': false,
    'global': false,
    'url': "assets/js/settings.json",
    'dataType': "json",
    'success': function (data) {
      if (!("SELF_DOMAIN" in data && "API_DOMAIN" in data && "MODELS_FOLDER" in data && "WEBSOCKET_DOMAIN" in data)) {
        console.error("The settings.json file is not well formatted");
        saveError("The settings.json file is not well formatted");
      } else {
        SELF_DOMAIN = data["SELF_DOMAIN"];
        API_DOMAIN = data["API_DOMAIN"];
        MODELS_FOLDER = data["MODELS_FOLDER"];
        WEBSOCKET_DOMAIN = data["WEBSOCKET_DOMAIN"];
      }
    }
});

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

/* Websockets settings*/
const MAX_RETRIES = 5;
const TIMEOUT_BETWEEN_RETRIES = 5000;

/* Define error pages URLS */
const DEVICE_IS_SMALL = SELF_DOMAIN + 'error-pages/device-is-small.html';
const MODEL_NOT_FOUND = SELF_DOMAIN + 'error-pages/model-not-found.html';
const NOT_COMPATIBLE = SELF_DOMAIN + 'error-pages/not-compatible.html';
const NO_JS = SELF_DOMAIN + 'error-pages/no-js.html';
const ERROR_SERVER = SELF_DOMAIN + 'error-pages/500.html';