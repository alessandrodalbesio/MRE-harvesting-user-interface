/*
TO DO:
- Preview doesn't show the texture when texture uploaded with image
*/
import { modelPreviewManager, modelPreviewManagerTextureUpload } from "modelPreview";


/* Constants definition */
const API_ENDPOINT_URL = "http://127.0.0.1:5000/";
const API_ENDPOINTS = {
  "model": {
    "list": {
      "url": API_ENDPOINT_URL+"models",
      "method": "GET"
    },
    "delete": {
      "url": API_ENDPOINT_URL+"model/",
      "method": "DELETE"
    },
    "update": {
      "url": API_ENDPOINT_URL+"model/",
      "method": "PUT"
    }
  },
  "texture": {
    "delete": {
      "url": API_ENDPOINT_URL+"texture/",
      "method": "DELETE"
    },
    "create": {
      "url": API_ENDPOINT_URL+"texture/",
      "method": "POST"
    },
    "setDefault": {
      "url": API_ENDPOINT_URL+"texture/default/",
      "method": "PUT"
    }
  }
}
const URL_MODEL_CREATION = "new-model.html";
const MODELS_FOLDER = "models/";
const MODEL_FILE_NAME = 'model'
const MODEL_TEXTURE_PREVIEW_NAME = 'preview'
const MODEL_TEXTURE_PREVIEW_FORMAT = 'jpg'

/* Data variables */
let models = []; /* List of all the models */
let modelPreview = null; /* Object that will manage the creation of the models preview when a new texture is uploaded */
let modelLoaded = false; /* If the model is loaded in the 3D viewer */
let openModelID = null; /* The ID of the model that is currently opened in the left banner */
let openModelSelectedModel = null; /* The model that is currently opened in the left banner */


/* Banner management */
function openModelBanner(modelID) {
  let selectedModel = models.find((item) => item.IDModel === modelID);  
  openModelID = modelID;
  openModelSelectedModel = selectedModel;

  /* Create banner content */
  $("#modelBanner .body .texture").remove();
  openModelSelectedModel.textures.forEach((texture) => { addTextureDOM(texture) });
  $("#modelBanner .header .title").val(openModelSelectedModel.modelName);

  /* Show the banner */
  $("#modelBanner").addClass("active");
  $("#bannerOverlay").addClass("active");
  $("#bannerOverlay, .close-banner").on("click", () => { closeModelbanner() });
}

function closeModelbanner() {
  openModelID = null;
  openModelSelectedModel = null;
  modelLoaded = false;
  $("#modelBanner").removeClass("active");
  $("#bannerOverlay").removeClass("active");
  $("#bannerOverlay, .close-banner").off("click");
}

/* Model management */
let addModelToDom = function (model) {
  let imgPreview = MODELS_FOLDER + model.IDModel + "/" + model.defaultTexture.textureID + "-"+MODEL_TEXTURE_PREVIEW_NAME+"."+MODEL_TEXTURE_PREVIEW_FORMAT;
  let imgSelectedTexture = MODELS_FOLDER + model.IDModel + "/" + model.defaultTexture.textureID + "."+model.defaultTexture.textureExtension;
  $(".models > .row").append(
    `<div class="col-12 col-sm-6 col-lg-4 col-xl-3 mb-4 model" data-model_id="${model.IDModel}" data-model_name="${model.modelName}">
        <div class="card">
          <img src="${imgPreview}" class="model-img" alt="Image Model ${model.modelName}">
          <img src="${imgSelectedTexture}" class="active-model-texture-img" alt="Active Texture Image"> 
          <span>${model.modelName}</span>
        </div>
      </div>`
    );
    $(".models > .row > div[data-model_id='" + model.IDModel + "']").on("click", () => { openModelBanner(model.IDModel) });
};

let removeModelFromDom = (modelID) => { 
  $(`.models > .row > div[data-model_id="${modelID}"]`).remove()
};

let deleteModel = function (params) {
  $.ajax({
    url: API_ENDPOINTS.model.delete.url + openModelID,
    type: API_ENDPOINTS.model.delete.method,
    success: function (data) {
      removeModelFromDom(openModelID);
      closeModelbanner();
      alertBanner('Model deleted successfully', true, 'main-alert');
    },
    error: function (error) {
      let textError = JSON.parse(error.responseText);
      alertBanner("<b>Error deleting the model</b>: " + textError.message, false, 'banner-alert');
    }
  });
};

let updateModelname = function(modelID, modelName) {
  /* Verify that the modelName doesn't exists */
  let model = models.find((item) => item.modelName === modelName);
  if (model) {
    alertBanner("The model name already exists", false, 'banner-alert');
    return;
  }
  let formData = new FormData();
  formData.append("modelName", modelName);
  $.ajax({
    url: API_ENDPOINTS.model.update.url + modelID,
    type: API_ENDPOINTS.model.update.method,
    data: formData,
    processData: false,
    contentType: false,
    success: function (data) {
      $(`.models > .row > div[data-model_id="${modelID}"]`).attr("data-model_name", modelName);
      $(`.models > .row > div[data-model_id="${modelID}"] .card span`).text(modelName)
    },
    error: function (error) {
      let textError = JSON.parse(error.responseText);
      alertBanner("Error updating the model name: " + textError.message, false, 'banner-alert');
    }
  });
}

/* Texture */
let addTextureDOM = function (texture) {
  let defaultTexture = models.find(model => model.IDModel == openModelID).defaultTexture.textureID;
  let imgUrl = MODELS_FOLDER + openModelID + "/" + texture.IDTexture + "." + texture.extension;
  $(".banner .body > .title").after(`
    <div class="col-6 mb-3 texture ${defaultTexture == texture.IDTexture ? 'defaultTexture' : ''} ${isSelected(openModelID, texture.IDTexture) ? 'active' : ''}" data-id_texture="${texture.IDTexture}">
      <span class="badge bg-secondary">Active</span>
      <i class="fa-solid fa-trash-can deleteTextureIcon"></i>
      <i class="fa-regular fa-star selectDefaultTexture"></i>
      <img src="${imgUrl}">
    </div>
  `)
  $("#modelBanner .texture[data-id_texture='" + texture.IDTexture + "'] .deleteTextureIcon").click(function () {
    let textureID = $(this).parent().data("id_texture");
    requestConfirm(
      `Are you sure you want to delete the texture?`,
      deleteTexture,
      textureID
    );
  });
  
  $("#modelBanner .texture[data-id_texture='" + texture.IDTexture + "'] .selectDefaultTexture").click(function () {
    let textureID = $(this).parent().data("id_texture");
    changeDefaultTexture(textureID);
  });

  $("#modelBanner .texture[data-id_texture='" + texture.IDTexture + "'] img").click(function () {
    /* For each model into the scene modify the model preview and set the model default texture */
    $(".model").each(function () {
      let modelID = $(this).data("model_id");
      let model = models.find((item) => item.IDModel === modelID);
      let imgPreview = MODELS_FOLDER + model.IDModel + "/" + model.defaultTexture.textureID + "-"+MODEL_TEXTURE_PREVIEW_NAME+"."+MODEL_TEXTURE_PREVIEW_FORMAT;
      $(this).find("img").attr("src", imgPreview);
    });
    if ($(this).parent().hasClass("active")) {
      $(this).parent().removeClass("active");
      unsetSelected();
    } else {
      $("#modelBanner .texture").removeClass("active");
      $(this).parent().addClass("active");
      selectElement(openModelID, texture.IDTexture);
    }
  });
};

let removeTextureFromDom = function (textureID) {
  $(`.banner .body .texture[data-id_texture="${textureID}"]`).remove();
}

let deleteTexture = function(textureID) {
  textureID = textureID[0];
  if (models.find((item) => item.IDModel === openModelID).defaultTexture.textureID === textureID) {
    alertBanner("Error deleting the texture: The default texture cannot be deleted", false, 'banner-alert');
    return;
  }
  if (isSelected(openModelID, textureID)) {
    alertBanner("Error deleting the texture: The selected texture cannot be deleted", false, 'banner-alert');
    return;
  }
  $.ajax({
    url: API_ENDPOINTS.texture.delete.url + textureID,
    type: API_ENDPOINTS.texture.delete.method,
    success: function (data) {
      removeTextureFromDom(textureID);
      for(let i = 0; i < models.length; i++) {
        if(models[i].IDModel === openModelID) {
          models[i].textures = models[i].textures.filter((texture) => texture.IDTexture !== textureID);
          break;
        }
      }
      alertBanner('Texture deleted successfully', true, 'banner-alert');
    },
    error: function (error) {
      console.log(error);
      let textError = JSON.parse(error.responseText);
      alertBanner("<b>Error deleting the texture</b>: " + textError.message, false, 'banner-alert');
    }
  });
}

let textureLoadingCallback = function(callback, param) {
  modelLoaded = true;
  callback(param);
}

let createTextureFromColor = function(color) {
  if(!modelLoaded) {
    let selectedModel = models.find((item) => item.IDModel === openModelID);
    let selectedModelUrl = MODELS_FOLDER + openModelID + "/"+MODEL_FILE_NAME+"."+selectedModel.modelExtension;
    modelPreview.setSceneParameters(selectedModel.cameraInformations);
    modelPreview.loadModelInScene(selectedModelUrl, textureLoadingCallback, createTextureFromColor, color);
  }
  else {
    modelPreview.applyTextureToModelFromColor(color);
    let formData = new FormData();
    formData.append("modelID", openModelID);
    formData.append("textureColor", color);
    formData.append("modelWithTexturePreview", modelPreview.captureScreenshot().img);
    $.ajax({
      url: API_ENDPOINTS.texture.create.url + "color",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (data) {
        let parsedData = JSON.parse(data);
        for(let i = 0; i < models.length; i++) {
          if(models[i].IDModel == openModelID) {
            models[i].textures.push(parsedData);
            break;
          }
        }
        addTextureDOM(parsedData);
        alertBanner('Texture created successfully', true, 'banner-alert');
      },
      error: function (error) {
        let textError = JSON.parse(error.responseText);
        alertBanner("<b>Error creating the texture</b>: " + textError.message, false, 'banner-alert');
      }
    });
  }
}

let createTextureFromImage = function(image) {
  if(!modelLoaded) {
    let selectedModel = models.find((item) => item.IDModel === openModelID);
    let selectedModelUrl = MODELS_FOLDER + openModelID + "/"+MODEL_FILE_NAME+"."+selectedModel.modelExtension;
    modelPreview.setSceneParameters(selectedModel.cameraInformations);
    modelPreview.loadModelInScene(selectedModelUrl, textureLoadingCallback, createTextureFromImage, image);
  }
  else {
    modelPreview.applyTextureToModelFromImage(URL.createObjectURL(image));
    let formData = new FormData();
    formData.append("modelID", openModelID);
    formData.append("textureImage", image);
    formData.append("modelWithTexturePreview", modelPreview.captureScreenshot().img);
    $.ajax({
      url: API_ENDPOINTS.texture.create.url + "image",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (data) {
        let parsedData = JSON.parse(data);
        for(let i = 0; i < models.length; i++) {
          if(models[i].IDModel == openModelID) {
            models[i].textures.push(parsedData);
            break;
          }
        }
        addTextureDOM(parsedData);
        alertBanner('Texture created successfully', true, 'banner-alert');
      },
      error: function (error) {
        let textError = JSON.parse(error.responseText);
        alertBanner("<b>Error creating the texture</b>: " + textError.message, false, 'banner-alert');
      }
    });
  }
}

let changeDefaultTexture = function(textureID) {
  let modelID = openModelID;
  let formData = new FormData();
  formData.append("textureID", textureID);
  $.ajax({
    url: API_ENDPOINTS.texture.setDefault.url + modelID,
    type: API_ENDPOINTS.texture.setDefault.method,
    data: formData,
    processData: false,
    contentType: false,
    success: function (data) {
      $("#modelBanner .texture").removeClass("defaultTexture");
      $("#modelBanner .texture[data-id_texture='" + textureID + "']").addClass("defaultTexture");
      for(let i = 0; i < models.length; i++) {
        if(models[i].IDModel == modelID) {
          models[i].defaultTexture.textureID = textureID;
          models[i].defaultTexture.textureExtension = models[i].textures.find((item) => item.IDTexture === textureID).textureExtension;
          break;
        }
      }
      if (getSelectedModelID() != modelID) {
        let imgSrc = MODELS_FOLDER + modelID + "/" + textureID + "-"+MODEL_TEXTURE_PREVIEW_NAME+"."+MODEL_TEXTURE_PREVIEW_FORMAT;
        $(".model[data-model_id='" + modelID + "'] .model-img").attr("src", imgSrc);
      }
    },
    error: function (error) {
      let textError = JSON.parse(error.responseText);
      alertBanner("<b>Error changing the default texture</b>: " + textError.message, false, 'banner-alert');
    }
  });
}

/* Confirm banner */
function requestConfirm(message, callback, ...args) {
  $("#confirmModal .modal-body").html(message);
  /* Toogle a bootstrap modal */
  $("#confirmModal").modal("toggle");     
  $("#confirmButtonConfirmModal").click(() => {
    callback(args);
    $("#confirmModal").modal("toggle");
  });
}

/* Search bar */
$("#searchBar input").keyup((e) => {
  $(".model")
    .show()
    .filter(function () {
      return (
        $(this)
          .data("model_name")
          .toLowerCase()
          .indexOf($("#searchBar input").val().toLowerCase()) != 0
      );
    })
    .hide();
});

/* JQUERY management */
$(document).ready(function () {
  /* Load models */
  (function () {
    $.ajax({
      url: API_ENDPOINTS.model.list.url,
      type: API_ENDPOINTS.model.list.method,
      success: function (data) {
        models = JSON.parse(data);
        if(models.length == 0)
          window.location.href = URL_MODEL_CREATION;
        models.forEach((element) => { addModelToDom(element) });
        modelPreview = new modelPreviewManagerTextureUpload("imagePreviewForTextureCreation");
      },
      error: function () {
        alertBanner('Something went wrong during the loading of the models. Please try again later.', false, 'main-alert', true);
      }
    });
  })();

  /* Add event listener */
  $("#modelNameBanner").on("change", function() {
    let newName = $(this).val();
    updateModelname(openModelID, newName);
  });

  /* Manage model delete */
  $("#deleteModelButton").click(function() {
    requestConfirm(
      `Are you sure you want to delete the model?`,
      deleteModel,
      openModelID
    );
  })

  /* Select texture input method */
  $("#selectTextureInputMethod").change(function () {
    $("#uploadNewTextureButton").removeClass("d-none");
    if ($(this).val() === "image") {
      $("#textureInputMethodImage").removeClass("d-none");
      $("#textureInputMethodColor").addClass("d-none");
    } else if ($(this).val() === "color") {
      $("#textureInputMethodImage").addClass("d-none");
      $("#textureInputMethodColor").removeClass("d-none");
    } else {
      $("#textureInputMethodImage, #textureInputMethodColor, #uploadNewTextureButton").addClass("d-none");
    }
  });

  $("#uploadNewTextureButton").click(function () {
    if ($("#selectTextureInputMethod").val() === "image") {
      createTextureFromImage($("#textureInputMethodImage input")[0].files[0]);
    } else if ($("#selectTextureInputMethod").val() === "color") {
      createTextureFromColor($("#textureInputMethodColor input").val());
    }
    /* Reset the input */
    $("#selectTextureInputMethod").val("default");
    $("#textureInputMethodImage input").val("");
    $("#textureInputMethodColor input").val("");
    $("#textureInputMethodImage, #textureInputMethodColor, #uploadNewTextureButton").addClass("d-none");
  });


  /* Redirect the user to the page for the model upload */
  $("#newModelRedirectButton").click(() => { window.location.href = URL_MODEL_CREATION });
});

/* Selected active texture and model management */
let selectedElement = { 
  modelID: null, 
  textureID: null 
}

let getSelectedModelID = function() {
  return selectedElement.modelID;
}

let getSelectedTextureID = function() {
  return selectedElement.textureID;
}

let getSelectedModel = function() {
  return models.find((item) => item.IDModel === selectedElement.modelID);
}

let isSelected = function(modelID, IDTexture) {
  return selectedElement.modelID === modelID && selectedElement.IDTexture === IDTexture;
}

let selectElement = function(modelID, IDTexture) {
  unsetSelected();
  let model = models.find((item) => item.IDModel === modelID);
  let texture = model.textures.find((item) => item.IDTexture === IDTexture);

  selectedElement.modelID = modelID;
  $(`.models > .row > div[data-model_id="${modelID}"]`).addClass("active");
  let modelPreviewURL = MODELS_FOLDER + modelID + "/" + texture.IDTexture + "-"+MODEL_TEXTURE_PREVIEW_NAME+"."+MODEL_TEXTURE_PREVIEW_FORMAT;
  $(`.models > .row > div[data-model_id="${modelID}"] > .card > .model-img`).attr("src", modelPreviewURL);

  selectedElement.IDTexture = IDTexture;
  let texturePreviewURL = MODELS_FOLDER + modelID + "/" + texture.IDTexture + "." + texture.extension;
  $(`.models > .row > div[data-model_id="${modelID}"] > .card > .active-model-texture-img`).attr("src", texturePreviewURL);
}

let unsetSelected = function() {
  $(".models > .row > div").removeClass("active");
  selectedElement.modelID = null;
  selectedElement.IDTexture = null;
}