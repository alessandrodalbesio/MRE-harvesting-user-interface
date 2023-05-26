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

  /* Definition of the modelPreview */
  const modelPreview = new modelPreviewManager('model-preview');

  /* Resizing of the canvas based on the width of the container and verify that the device is not too small */
  (function () {
    const bodyWidth = $("#body").width();
    if (window.innerWidth > MIN_PAGE_WIDTH)
      modelPreview.resize(bodyWidth*CANVAS_WIDTH_RATION,bodyWidth*CANVAS_HEIGHT_RATION)
    else
      console.log("Error")
      //window.location.href = DEVICE_IS_SMALL;
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
      error: function () {
        //window.location.href = ERROR_SERVER;
      }
    })
  })();


  let verifyNumberOfModels = function () {
    $.ajax({
      url: API_ENDPOINTS.model.list.url,
      type: API_ENDPOINTS.model.list.method,
      dataType: "json",
      success: function (response) {
        if (response.length == 0)
          $(".header button").addClass("d-none");
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
        error: function () {
          alertBanner("An error occurred while verifying the model name", false);
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
      $("#texture-image, #texture-color").val(""); /* Reset the content */
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
  let defaultAmbientLight = modelPreview.defaultAmbientLight;
  $('#toggleAmbientLight').prop('checked', defaultAmbientLight);
  $('#toggleAmbientLight').change(function () {
    if(!modelPreview.changeLightInScene())
      alertBanner('Something went wrong.');
    else {
      defaultAmbientLight = !defaultAmbientLight;
      if(defaultAmbientLight)
        $("#toggleShadows").parent().hide();
      else 
        $("#toggleShadows").parent().show();
    }
  });

  $('#toggleShadows').prop('checked', modelPreview.defaultShadows);
  $('#toggleShadows').click(function () { 
    if(!modelPreview.toggleShadows())
      alertBanner('Something went wrong.');
  });  

  $('#groundColor').val(modelPreview.defaultGroundColor);
  $('#groundColor').change(function () { 
    if(!modelPreview.setGroundColor($(this).val()))
      alertBanner('Something went wrong.');
  });

  $('#groundVisibility').prop('checked', modelPreview.defaultGroundVisibility);
  $('#groundVisibility').click(function () { 
    if(!modelPreview.toggleGroundVisibility())
      alertBanner('Something went wrong.');
  });

  $('#backgroundColor').val(modelPreview.defaultBackgroundColor);
  $('#backgroundColor').change(function () { 
    if(!modelPreview.setBackgroundColor($(this).val()))
      alertBanner('Something went wrong.');
  });


  /* ###### Upload code ###### */
  /* Upload data to the server */
  $("#upload").click(function () {

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
        alertBanner("The model has been uploaded successfully", true);
        $("#modelNameInput, #modelFileInput, #texture-image, #texture-color").val("");
        $("#texture-selection-row, #model-preview-row").addClass('hide');
        $("#upload").hide();
        $("#texture-selection-row .need-validation").removeClass('need-validation is-valid');
        $("#texture-selection-row div").not(".texture-input-method").addClass('need-validation col-12').prop('selectedIndex',0);
        $(".texture-input-method").hide();
        $("#selectTextureInputMethod").val($("#selectTextureInputMethod option:first").val());
        verifyNumberOfModels();
        notifyNewModel();
      },
      error: function (response) {
        const jsonResponse = JSON.parse(response.responseText);
        if (jsonResponse.errorID)
          alertBanner(jsonResponse.message+"<br>Tracking error: "+jsonResponse.errorID, false);
        else
          alertBanner(jsonResponse.message, false);
      }
    });
  });
})


/* Websocket implementation */
const socket = new WebSocket(WEBSOCKET_DOMAIN);
socket.addEventListener('open', function (event) {
  console.log("Websocket connection established");
});
socket.addEventListener('close', function (event) {
  console.log("Websocket connection closed");
});
socket.addEventListener('error', function (event) {
  console.log("Websocket connection error");
});
socket.addEventListener('message', function (event) {
  const message = JSON.parse(event.data);
  if (message.type === "new-model") {
    verifyNumberOfModels();
  }
});
let notifyNewModel = function(IDModel) {
  socket.send(JSON.stringify({type: "new-model" }));
}