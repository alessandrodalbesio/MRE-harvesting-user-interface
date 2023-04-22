import { modelPreviewManager, modelPreviewManagerTextureUpload } from "modelPreview";

/* Page parameters definition */
const MAX_MODEL_FILE_SIZE = 10000000; // 10MB
const MAX_MODEL_NAME_LENGTH = 50; // 50 characters
const MODEL_EXTENSIONS = ['obj']; // Supported model extensions

const MAX_TEXTURE_FILE_SIZE = 10000000; // 10MB
const IMG_TEXTURE_EXTENSIONS = ['jpg', 'jpeg', 'png']; // Supported image extensions

const MIN_PAGE_WIDTH = 992; // The maximum width of the page
const CANVAS_WIDTH_RATION = 0.7; // The width of the canvas is 70% of the page width
const CANVAS_HEIGHT_RATION = 0.5; // The height of the canvas is 60% of the page width

const VERIFY_WITH_SERVER = false; // If true, the input will be verified with the server

const UPLOAD_ENDPOINT = "http://127.0.0.1:5000/model";

$(document).ready(function () {

  /* ###### Page management code ###### */

  /* Definition of the modelPreview */
  const modelPreview = new modelPreviewManager('model-preview');

  /* Resizing of the canvas based on the width of the container and verify that the device is not too small */
  (function () {
    const bodyWidth = $("#body").width();
    if (window.innerWidth > MIN_PAGE_WIDTH) {
      modelPreview.resize(bodyWidth*CANVAS_WIDTH_RATION,bodyWidth*CANVAS_HEIGHT_RATION)
    } else {
      window.location.href = "http://"+DOMAIN+"/error-pages/device-is-small.html"
    }
  })();


  /* Manage input name input */
  $("#modelNameInput").change(function () {
    if(isInputValidType($(this), "The model name", "string") && isInputValidLength($(this), "The model name", MAX_MODEL_NAME_LENGTH)) {
      if(VERIFY_WITH_SERVER) {
        /* Verify that the model name is not taken */
        $.ajax({
          url: API_URL + "/models/name/" + $(this).val(),
          type: "GET",
          dataType: "json",
          success: function (response) {
            if (response.status === "success") {
              addValidInputClass($("#modelNameInput"));
            } else {
              displayInputFeedback($("#modelNameInput"), "The model name is already taken");
            }
          },
          error: function (response) {
            alertBanner("An error occurred while verifying the model name", false);
          }
        });
      } else {
        addValidInputClass($(this));
      }
    }
    showUploadButton();
  });


  /* Manage 3D model input */
  $("#modelFileInput").change(function () {
    /* Validation */
    if(isFileNotUndefined($(this)) && isFileValidExtension($(this), "The model file", MODEL_EXTENSIONS) && isFileValidWeight($(this), "The model file", MAX_MODEL_FILE_SIZE)) {
      addValidInputClass($(this));

      /* Manage preview */
      modelPreview.loadModelInScene(URL.createObjectURL($(this)[0].files[0]));
      $("#model-preview-row").removeClass('hide');

      /* Manage texture selection */
      $("#texture-selection-row").removeClass('hide');
      $("#texture-selection-row .need-validation").removeClass('need-validation is-valid');
      $("#texture-selection-row div").not(".texture-input-method").addClass('need-validation col-12').prop('selectedIndex',0);
      $(".texture-input-method").hide();
      $("#texture-image, #texture-color").val("");
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
      modelPreview.applyTextureToModelFromColor(modelPreview.defaultObjectColor);
    } else if (selectedValue === "color") {
      $("#texture-color").parent().addClass('need-validation').show();
      $("#texture-color").val(modelPreview.defaultObjectColor);
      addValidInputClass($("#texture-color"));
      $("#texture-image").parent().removeClass('need-validation is-valid');
      $("#texture-image").val("");
    } else {
      $(this).parent().removeClass("col-6").addClass('col-12 need-validation');
      modelPreview.applyTextureToModelFromColor(modelPreview.defaultObjectColor);
    }
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
    if ($(".need-validation.is-valid").length === $(".need-validation").length) {
      $("#upload").show();
    } else {
      $("#upload").hide();
    }
  }

  /* General purpose functions */
  $(".return").click(() => {window.location.href = "index.html"});


  /* Model preview settings */
  let defaultAmbientLight = modelPreview.defaultAmbientLight;
  $('#toggleAmbientLight').prop('checked', defaultAmbientLight);
  $('#toggleAmbientLight').change(function () {
    if(!modelPreview.changeLightInScene()) {
      alertBanner('Something went wrong.');
    }
    else {
      defaultAmbientLight = !defaultAmbientLight;
      if(defaultAmbientLight) {
        $("#toggleShadows").parent().hide();
      } else {
        $("#toggleShadows").parent().show();
      }
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
      url: UPLOAD_ENDPOINT,
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      cache: false,
      success: function (response) {
        alertBanner("The model has been uploaded successfully", true);
        $("#modelNameInput, #modelFileInput, #texture-image, #texture-color").val("");
        $("#texture-selection-row, #model-preview-row").addClass('hide');
        $("#upload").hide();
        $("#texture-selection-row .need-validation").removeClass('need-validation is-valid');
        $("#texture-selection-row div").not(".texture-input-method").addClass('need-validation col-12').prop('selectedIndex',0);
        $(".texture-input-method").hide();
      },
      error: function (response) {
        const jsonResponse = JSON.parse(response.responseText);
        if (jsonResponse.errorID) {
          alertBanner(jsonResponse.message+"<br>Tracking error: "+jsonResponse.errorID, false);
        }
        else {
          alertBanner(jsonResponse.message, false);
        }
      }
    });
  });

})