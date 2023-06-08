import { modelPreviewManager, modelPreviewManagerTextureUpload } from "modelPreview";

/* Settings specific to the the upload (they are retrieved from the server) */
let MAX_MODEL_FILE_SIZE = null;
let MAX_MODEL_NAME_LENGTH = null;
let MODEL_EXTENSIONS = null;
let MAX_TEXTURE_FILE_SIZE = null;
let IMG_TEXTURE_EXTENSIONS = null;

/* Settings specific of the page */
const MIN_PAGE_WIDTH = 992; // The maximum width of the page
const CANVAS_WIDTH_RATION = 0.7; // The width of the canvas is 70% of the page width
const CANVAS_HEIGHT_RATION = 0.5; // The height of the canvas is 60% of the page width


$(document).ready(function () {
  const modelPreview = new modelPreviewManager('model-preview');

  /* Resizing of the canvas based on the width of the container and verify that the device is not too small */
  (function () {
    const bodyWidth = $("#body").width();
    if (window.innerWidth > MIN_PAGE_WIDTH)
      modelPreview.resize(bodyWidth*CANVAS_WIDTH_RATION,bodyWidth*CANVAS_HEIGHT_RATION)
    else
      window.location.href = DEVICE_IS_SMALL;
  })();

  /* Get the parameters needed from the server */
  (function () {
    $.ajax({
      url: API_ENDPOINTS.settings.get.url,
      type: API_ENDPOINTS.settings.get.method,
      dataType: "json",
      success: function (response) {
        MAX_MODEL_FILE_SIZE = response.maxModelFileSize;
        MAX_MODEL_NAME_LENGTH = response.maxModelNameLength;
        MODEL_EXTENSIONS = response.validModelExtensions;
        MAX_TEXTURE_FILE_SIZE = response.maxTextureFileSize;
        IMG_TEXTURE_EXTENSIONS = response.validTextureExtensions;
      },
      error: function (error) {
        saveError(error.status + " " + error.statusText);
        window.location.href = ERROR_SERVER;
      }
    })
  })();

  /* If the number of models available is higher than one show the button to go to the home page otherwise hide it */
  let verifyNumberOfModels = function () {
    $.ajax({
      url: API_ENDPOINTS.model.list.url,
      type: API_ENDPOINTS.model.list.method,
      dataType: "json",
      success: function (response) {
        if (response.length == 0)
          $(".header button").addClass("d-none");
        else
          $(".header button").removeClass("d-none");
      }, 
      error: function (error) {
        saveError(error.status + " " + error.statusText);
        window.location.href = ERROR_SERVER;
      }
    })
  }
  verifyNumberOfModels();


  /* Manage input name input */
  $("#modelNameInput").change(function () {
    if(isInputValidType($(this), "The model name", "string") && isInputValidLength($(this), "The model name", MAX_MODEL_NAME_LENGTH)) {
      $.ajax({
        url: API_ENDPOINTS.model.exists.url + $(this).val(),
        type: "GET",
        dataType: "json",
        success: function (response) {
          if (response.modelNameAlreadyUsed) {
            displayInputFeedback($("#modelNameInput"), "The model name is already taken");
          } else {
            addValidInputClass($("#modelNameInput"));
          }
        },
        error: function (error) {
          saveError(error.status + " " + error.statusText);
          window.location.href = ERROR_SERVER;
        }
      });
    }
    showUploadButton();
  });


  /* Manage 3D model input */
  $("#modelFileInput").change(function () {
    /* Validation */
    if(isFileNotUndefined($(this)) && isFileValidExtension($(this), "The model file", MODEL_EXTENSIONS) && isFileValidWeight($(this), "The model file", MAX_MODEL_FILE_SIZE)) {
      addValidInputClass($(this));

      /* Load the model and show the preview*/
      modelPreview.loadModelInScene(URL.createObjectURL($(this)[0].files[0]));
      $("#model-preview-row").removeClass('hide');

      /* Show the texture section */
      $("#texture-selection-row").removeClass('hide');
      $("#texture-selection-row .need-validation").removeClass('need-validation is-valid');
      $("#texture-selection-row div").not(".texture-input-method").addClass('need-validation col-12').prop('selectedIndex',0);
      $(".texture-input-method").hide(); /* Hide all the texture inputs (they will be shown when an input method has been chosen) */
      $("#texture-image").val(""); /* Reset the content */
      $("#texture-color").val("#ffffff"); /* Reset the content */
    }
    else {
      $("#texture-selection-row, #model-preview-row").addClass('hide');
    }
    /* Manage upload button */
    showUploadButton();

    /*** 
      NOTE: in this case it has been used the class 'hide' instead of the methods hide() and show() to avoid having problems with the default 
            stype of the class .row 
    ***/
  });


  /* Manage texture input methods */
  $("#selectTextureInputMethod").change(function () {
    /* Resize the input method container */
    $(this).parent().removeClass("col-12 need-validation").addClass('col-6');

    /* Show only the input method selected */
    const selectedValue = $(this).val();
    $(".texture-input-method").hide();
    if (selectedValue === "image") {
      $("#texture-image").parent().addClass('need-validation').show();
      $("#texture-color").parent().removeClass('need-validation is-valid');
      $("#texture-color").val("");
    } else if (selectedValue === "color") {
      $("#texture-color").parent().addClass('need-validation').show();
      $("#texture-color").val(modelPreview.defaultObjectColor);
      addValidInputClass($("#texture-color")); /* Every choosen color is valid */
      $("#texture-image").parent().removeClass('need-validation is-valid');
      $("#texture-image").val("");
    } else {
      $(this).parent().removeClass("col-6").addClass('col-12 need-validation');
    }
    modelPreview.applyTextureToModelFromColor(modelPreview.defaultObjectColor);
    showUploadButton();
  });


  /* Manage texture color upload */
  $("#texture-color").change(function () {
    if(isInputValidColor($(this), "The texture color")) {
      addValidInputClass($(this));
      modelPreview.applyTextureToModelFromColor($(this).val());
    }
    showUploadButton();
  });

  
  /* Manage texture image upload */
  $("#texture-image").change(function () {
    if(isFileNotUndefined($(this)) && isFileValidExtension($(this), "The texture image", IMG_TEXTURE_EXTENSIONS) && isFileValidWeight($(this), "The texture image", MAX_TEXTURE_FILE_SIZE)) {
      addValidInputClass($(this));
      modelPreview.applyTextureToModelFromImage(URL.createObjectURL($("#texture-image")[0].files[0]));
    }
    showUploadButton();
  });


  /* Manage upload button */
  function showUploadButton() {
    /* Verify that all inputs that need validation are valid */
    if ($(".need-validation.is-valid").length === $(".need-validation").length) {
      $("#upload").show();
    } else {
      $("#upload").hide();
    }
  }

  /* General purpose functions */
  $(".return").click(() => {window.location.href = HOME});


  /* Model preview settings */
  $('#backgroundColor').val(modelPreview.defaultBackgroundColor);
  $('#backgroundColor').change(function () { 
    if(!modelPreview.setBackgroundColor($(this).val()))
      alertBanner('Something went wrong.');
  });


  /* ###### Upload code ###### */
  /* Upload data to the server */
  $("#upload").click(function () {
    /* Modify the button to show that it's loading */
    $(this).prop('disabled', true);
    $(this).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');

    /* Take a screenshot of the model and save the camera informations */
    let cameraInfo = modelPreview.captureScreenshot();
    let modelWithTexturePreview = cameraInfo.img;
    delete cameraInfo.img;

    /* Prepare the form data */
    const formData = new FormData();
    formData.append("modelName", $("#modelNameInput").val());
    formData.append("model", $("#modelFileInput")[0].files[0]);
    formData.append("cameraInfo", JSON.stringify(cameraInfo));
    formData.append("modelWithTexturePreview", modelWithTexturePreview);
    switch($("#selectTextureInputMethod").val()) {
      case "image":
        formData.append("textureType", "image")
        formData.append("textureImage", $("#texture-image")[0].files[0]);
        break;
      case "color":
        formData.append("textureType", "color")
        formData.append("textureColor", $("#texture-color").val());
        break;
      default:
        alertBanner('Something went wrong');
        cleanButtonInfo();
        return;
    }

    /* Send the data to the server */
    $.ajax({
      url: API_ENDPOINTS.model.create.url,
      type: API_ENDPOINTS.model.create.method,
      data: formData,
      processData: false,
      contentType: false,
      cache: false,
      success: function (data) {
        notifyNewModel();
      },
      error: function (response) {
        const jsonResponse = JSON.parse(response.responseText);
        saveError(error.status + " " + error.statusText);
        if (jsonResponse.errorID)
          alertBanner(jsonResponse.message+" - Tracking error: "+jsonResponse.errorID, false);
        else
          alertBanner(jsonResponse.message, false);
        cleanButtonInfo();
      }
    });
  });

  let cleanButtonInfo = function() {
    $("#upload").prop('disabled', false);
    $("#upload").html('Upload');
  }

  /* Function used to clean all the inputs */
  let cleanPreviousInput = function() {
    alertBanner("The model has been uploaded successfully", true);
    $("#modelNameInput, #modelFileInput, #texture-image, #texture-color").val("");
    $("#texture-selection-row, #model-preview-row").addClass('hide');
    $("#upload").hide();
    $("#texture-selection-row .need-validation").removeClass('need-validation is-valid');
    $("#texture-selection-row div").not(".texture-input-method").addClass('need-validation col-12').prop('selectedIndex',0);
    $(".texture-input-method").hide();
    $("#selectTextureInputMethod").val($("#selectTextureInputMethod option:first").val());
    cleanButtonInfo();
    verifyNumberOfModels();
  }

  let errorButton = function() {
    $("#upload").html('Error');
    $("#upload").prop('disabled', true);
    $("#upload").addClass('btn-danger');
    $("#upload").removeClass('btn-primary');
  }

  /* Websocket implementation */
  let socket = null;
  let retries_counter = 0;
  let scheduledNotification = false;

  function handleSocketConnection() {
    socket = new WebSocket(WEBSOCKET_DOMAIN);
    
    socket.addEventListener('open', function(event) {
      retries_counter = 0;
    });

    socket.addEventListener('close', function(event) {
      retries_counter++;
      if (retries_counter <= MAX_RETRIES) {
        setTimeout(handleSocketConnection, TIMEOUT_BETWEEN_RETRIES);
      } else {
        if(scheduledNotification) {
          alertBanner("The model has been uploaded but no synchronization message has been sent.", false, 'main-alert', true);
          scheduledNotification = false;
          errorButton();
        } else {
          alertBanner("Cannot connect to the websocket server.", false, 'main-alert', true);
          errorButton();
        }
      }
    });

    socket.addEventListener('message', function (event) {
      let message = JSON.parse(event.data);
      if (message.type === "new-model")
        verifyNumberOfModels();
    });  
  }
  handleSocketConnection();

  let notifyNewModel = function() {
    if (retries_counter < MAX_RETRIES) {
      scheduledNotification = true;
      if (socket.readyState == 1) {
        scheduledNotification = false;
        socket.send(JSON.stringify({type: "new-model" }));
        cleanPreviousInput();
      } else {
        setTimeout(notifyNewModel, TIMEOUT_TIME);
      }
    }
  }
})


/***** Input validation functions *****/
const VALID_INPUT_TYPES = ["string", "number", "boolean", "object", "function"];
const VALID_INPUT_CLASS = 'is-valid';

/* Display the input feedback */
function displayInputFeedback(inputID, text) {
    let feedbackDiv = $(inputID).parent().children(".input-feedback");
    removeValidInputClass(inputID);
    feedbackDiv.text(text);
    feedbackDiv.show();
}

/* Hide the input feedback */
function hideInputFeedback(inputID) {
    let feedbackDiv = $(inputID).parent().children(".input-feedback");
    feedbackDiv.hide();
}

/* Remove the valid input class */
function removeValidInputClass(inputID) {
    $(inputID).parent().removeClass(VALID_INPUT_CLASS);
}

/* Add the valid input class */
function addValidInputClass(inputID) {
    $(inputID).parent().addClass(VALID_INPUT_CLASS);
}

/* Verify the type of the input */
function isInputValidType(inputID, name, expectedType) {
    let inputValue = $(inputID).val();
    if (VALID_INPUT_TYPES.indexOf(expectedType) == -1) {
        console.error('The expected type "' + expectedType + '" is not valid');
        return false;
    }
    if (typeof inputValue !== expectedType) {
        displayInputFeedback(inputID, name + " is not a " + expectedType);
        return false;
    }
    hideInputFeedback(inputID);
    return true;
}

/* Verify the length of the input */
function isInputValidLength(inputID, name, maxLength) {
    let inputLength = $(inputID).val().length;
    if (inputLength > maxLength) {
        displayInputFeedback(inputID, name + " is too long");
        return false;
    }
    if (inputLength === 0) {
        displayInputFeedback(inputID, name + " is empty");
        return false;
    }
    hideInputFeedback(inputID);
    return true;
}

/* Verify if the input is a valid color */
function isInputValidColor(inputID, name) {
    let inputValue = $(inputID).val();
    if (inputValue.length !== 7 || inputValue[0] !== '#') {
        displayInputFeedback(inputID, name + " is not a valid color");
        return false;
    }
    hideInputFeedback(inputID);
    return true;
}

/* Verify that the file exists */
function isFileNotUndefined(inputID) {
    let file = $(inputID)[0].files[0];
    if (file === undefined) {
        displayInputFeedback(inputID, "Please select a file");
        return false;
    }
    hideInputFeedback(inputID);
    return true;
}

/* Verify that the file has a valid extension */
function isFileValidExtension(inputID, name, expectedExtensions) {
    let file = $(inputID)[0].files[0];
    if (expectedExtensions.indexOf(file.name.split(".").pop().toLowerCase()) == -1) {
        displayInputFeedback(inputID, name + " is not a valid file type");
        return false;
    }
    hideInputFeedback(inputID);
    return true;
}

/* Verify that the file is not too big or too small */
function isFileValidWeight(inputID, name, maxWeight) {
    let file = $(inputID)[0].files[0];
    if (file.size > maxWeight) {
        displayInputFeedback(inputID, name + " is too big");
        return false;
    }
    if (file.size === 0) {
        displayInputFeedback(inputID, name + " is empty");
        return false;
    }
    hideInputFeedback(inputID);
    return true;
}