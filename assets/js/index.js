import { modelPreviewManager, modelPreviewManagerTextureUpload } from "modelPreview";

const MODELS_FOLDER = "models/";
let MODEL_FILE_NAME = null
let MODEL_TEXTURE_PREVIEW_NAME = null
let MODEL_TEXTURE_PREVIEW_FORMAT = null

/* Data variables */
let models = []; /* List of all the models */
let modelPreview = null; /* Object that will manage the creation of the models preview when a new texture is uploaded */
let modelLoaded = false; /* If the model is loaded in the 3D viewer */
let openModelID = null; /* The ID of the model that is currently opened in the left banner */
let openModelSelectedModel = null; /* The model that is currently opened in the left banner */
let lockedModels = []; /* List of the models that are locked by other users */
let selectedElement = {  modelID: null,  IDTexture: null };

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
  /* Load settings */
  (function () {
    $.ajax({
      url: API_ENDPOINTS.settings.get.url,
      type: API_ENDPOINTS.settings.get.method,
      success: function (data) {
        data = JSON.parse(data);
        MODEL_FILE_NAME = data.modelFileName;
        MODEL_TEXTURE_PREVIEW_NAME = data.modelTexturePreviewName;
        MODEL_TEXTURE_PREVIEW_FORMAT = data.modelTexturePreviewFormat;

        $.ajax({
          url: API_ENDPOINTS.model.list.url,
          type: API_ENDPOINTS.model.list.method,
          success: function (data) {
            models = JSON.parse(data);
            if(models.length == 0)
              window.location.href = NEW_MODEL;
            models.forEach((element) => { addModelToDom(element) });
            modelPreview = new modelPreviewManagerTextureUpload("imagePreviewForTextureCreation");
          },
          error: function () {
            window.location.href = ERROR_SERVER;
          }
        });
      },
      error: function () {
        window.location.href = URL_ERROR;
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
  $("#newModelRedirectButton").click(() => { window.location.href = NEW_MODEL });
});



/* Socket connection */
const socket = io(SELF_DOMAIN, {path: WEBSOCKET_PATH});
socket.connect();

/* Models management */
socket.on('new-model', function(data) {
  let IDModel = data.IDModel;
  $.ajax({
    url: API_ENDPOINTS.model.get.url + IDModel,
    type: API_ENDPOINTS.model.get.method,
    success: function (data) {
      models.push(JSON.parse(data));
      addModelToDom(JSON.parse(data));
    },
    error: function(err) {  
      window.location.href = ERROR_SERVER;
    }
  });
})
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

/* Model update */
socket.on('update-model', function(data) {
  let IDModel = data.IDModel;
  $.ajax({
    url: API_ENDPOINTS.model.get.url + IDModel,
    type: API_ENDPOINTS.model.get.method,
    success: function (data) {
      data = JSON.parse(data);
      
      /* Update model in models */
      let index = models.findIndex((item) => item.IDModel === IDModel);
      models[index] = data;

      /* Update model in DOM */
      updateModelnameDOM(IDModel, data.modelName);
      
      /* If the selected model is the updated one, update the banner */
      if (openModelID == IDModel)
        $("#modelNameBanner").val(data.modelName);
    }, error: function(err) {
      window.location.href = ERROR_SERVER;
    }
  });
})

let notifyModelUpdate = function(IDModel) {
  socket.emit('update-model', { IDModel: IDModel });
}

let updateModelnameDOM = function (modelID, modelName) {
  /* Update the model of the model in the DOM */
  $(`.models > .row > div[data-model_id="${modelID}"]`).attr("data-model_name", modelName);
  $(`.models > .row > div[data-model_id="${modelID}"] .card span`).text(modelName)
};

let updateModelname = function(modelID, modelName) {
  /* Verify that the modelName doesn't exists */
  let model = models.find((item) => item.modelName === modelName);
  if (model) {
    alertBanner("The model name already exists", false, 'banner-alert');
    return;
  }

  /* Update the model name */
  let formData = new FormData();
  formData.append("modelName", modelName);
  $.ajax({
    url: API_ENDPOINTS.model.update.url + modelID,
    type: API_ENDPOINTS.model.update.method,
    
    data: formData,
    processData: false,
    contentType: false,
    success: function (data) {
      let index = models.findIndex((item) => item.IDModel === modelID);
      models[index].modelName = modelName;
      updateModelnameDOM(modelID, modelName);
      alertBanner('Model name updated successfully', true, 'main-alert');
      notifyModelUpdate(modelID);
    },
    error: function (error) {
      let textError = JSON.parse(error.responseText);
      alertBanner("Error updating the model name: " + textError.message, false, 'banner-alert');
    }
  });
}


/* Model delete */
socket.on('delete-model', function(data) {
  let IDModel = data.IDModel;

  /* Remove model from models */
  let index = models.findIndex((item) => item.IDModel === IDModel);
  models.splice(index, 1);

  /* Remove model from DOM */
  removeModelFromDom(IDModel);
})

let notifyModelDeletion = function(IDModel) {
  socket.emit('delete-model', { IDModel: IDModel });
}

let removeModelFromDom = (modelID) => { 
  $(`.models > .row > div[data-model_id="${modelID}"]`).remove()

  /* Check if there is at least one model otherwise redirect to the new model page */
  if ($(".models > .row > div[data-model_id]").length === 0)
    window.location.href = NEW_MODEL;
};

let deleteModel = function (params) {
  let modelID = params[0];
  if (isModelLocked(modelID)) {
    alertBanner("You can't delete this model since another user is working on it.", false, 'banner-alert');
    return;
  }
  $.ajax({
    url: API_ENDPOINTS.model.delete.url + modelID,
    type: API_ENDPOINTS.model.delete.method,
    
    success: function (data) {
      /* Remove model from models array */
      models = models.filter((item) => item.IDModel !== modelID);

      /* Remove model from DOM */
      removeModelFromDom(modelID);
      closeModelbanner();
      alertBanner('Model deleted successfully', true, 'main-alert');

      /* Notify the other users */
      notifyModelDeletion(modelID);
    },
    error: function (error) {
      let textError = JSON.parse(error.responseText);
      alertBanner("Error deleting the model: " + textError.message, false, 'banner-alert');
    }
  });
};

/* Texture creation */
socket.on('new-texture', function(data) {
  let IDModel = data.IDModel;

  /* Get texture information */
  $.ajax({
    url: API_ENDPOINTS.model.get.url + data.IDModel,
    type: API_ENDPOINTS.model.get.method,
    success: function (data) {
      data = JSON.parse(data);

      /* Update model in models */
      let index = models.findIndex((item) => item.IDModel === IDModel);
      models[index] = data;
      
      /* If the banner is open, update the banner */
      if (openModelID == IDModel)
        refreshModelBannerContent();
    }, error: function(err) {
      window.location.href = ERROR_SERVER;
    }
  });
})
let notifyTextureAddition = function(IDModel) {
  socket.emit('new-texture', { IDModel: IDModel });
}

let updateDefaultDOMModelPreview = function() {
  $(".model").each(function () {
    let modelID = $(this).data("model_id");
    let model = models.find((item) => item.IDModel === modelID);
    let imgPreview = MODELS_FOLDER + model.IDModel + "/" + model.defaultTexture.textureID + "-"+MODEL_TEXTURE_PREVIEW_NAME+"."+MODEL_TEXTURE_PREVIEW_FORMAT;
    $(this).find("img").attr("src", imgPreview);
  });
}

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

  /* Add the delete event listener to the new texture */
  $("#modelBanner .texture[data-id_texture='" + texture.IDTexture + "'] .deleteTextureIcon").click(function () {
    let textureID = $(this).parent().data("id_texture");
    requestConfirm(
      `Are you sure you want to delete the texture?`,
      deleteTexture,
      textureID
    );
  });
  
  /* Add the select default texture event listener to the new texture */
  $("#modelBanner .texture[data-id_texture='" + texture.IDTexture + "'] .selectDefaultTexture").click(function () {
    let textureID = $(this).parent().data("id_texture");
    changeDefaultTexture(textureID);
  });

  /* Add the select texture event listener to the new texture */
  $("#modelBanner .texture[data-id_texture='" + texture.IDTexture + "'] img").click(function () {
    if ($(this).parent().hasClass("active"))
      unsetSelected();
    else 
      selectElement(openModelID, texture.IDTexture);
  });
};

let textureLoadingCallback = function(callback, param) {
  /* Needed to be sure that the model preview has been loaded */
  modelLoaded = true;
  callback(param);
}

let createTextureFromColor = function(color) {
  if(!modelLoaded) {
    let selectedModel = models.find((item) => item.IDModel === openModelID);
    let selectedModelUrl = MODELS_FOLDER + openModelID + "/"+MODEL_FILE_NAME+"."+selectedModel.modelExtension;
    modelPreview.setSceneParameters(selectedModel.cameraInformations); // Set the camera informations
    modelPreview.loadModelInScene(selectedModelUrl, textureLoadingCallback, createTextureFromColor, color);
    /*  What this function does is basically call back this function only after the model has been loaded (otherwise we cannot apply the texture for the preview). */
  }
  else {
    /* Apply the texture to the model preview */
    modelPreview.applyTextureToModelFromColor(color);

    /* Create the texture */
    let formData = new FormData();
    formData.append("modelID", openModelID);
    formData.append("textureColor", color);
    formData.append("modelWithTexturePreview", modelPreview.captureScreenshot().img);
    $.ajax({
      url: API_ENDPOINTS.texture.create.url + "color",
      type: API_ENDPOINTS.texture.create.method,
      
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
        notifyTextureAddition(openModelID);
        alertBanner('Texture created successfully', true, 'banner-alert');
      },
      error: function (error) {
        let textError = JSON.parse(error.responseText);
        alertBanner("Error creating the texture: " + textError.message, false, 'banner-alert');
      }
    });
  }
}

let createTextureFromImage = function(image) {
  /* This function is basically the same as createTextureFromColor */
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
      type: API_ENDPOINTS.texture.create.method,
      
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
        notifyTextureAddition(openModelID);
        alertBanner('Texture created successfully', true, 'banner-alert');
      },
      error: function (error) {
        let textError = JSON.parse(error.responseText);
        alertBanner("Error creating the texture: " + textError.message, false, 'banner-alert');
      }
    });
  }
}


/* Texture delete */

let removeTextureFromDom = function (textureID) {
  $(`.banner .body .texture[data-id_texture="${textureID}"]`).remove();
}

let deleteTexture = function(textureID) {
  textureID = textureID[0]; // The textureID is the first element of the array (look at the function requestConfirm)
  /* Verify that the texture is not the default texture */
  if (models.find((item) => item.IDModel === openModelID).defaultTexture.textureID === textureID) {
    alertBanner("Error deleting the texture: The default texture cannot be deleted", false, 'banner-alert');
    return;
  }
  /* Verify that the texture is not selected */
  if (isSelected(openModelID, textureID)) {
    alertBanner("Error deleting the texture: The selected texture cannot be deleted", false, 'banner-alert');
    return;
  }
  /* Delete the texture */
  $.ajax({
    url: API_ENDPOINTS.texture.delete.url + textureID,
    type: API_ENDPOINTS.texture.delete.method,
    
    success: function (data) {
      /* Remove the texture from the DOM */
      removeTextureFromDom(textureID);
      /* Remove the texture from the models array */
      for(let i = 0; i < models.length; i++) {
        if(models[i].IDModel === openModelID) {
          models[i].textures = models[i].textures.filter((texture) => texture.IDTexture !== textureID);
          break;
        }
      }
      notifyTextureDeletion(openModelID, textureID);
      alertBanner('Texture deleted successfully', true, 'banner-alert');
    },
    error: function (error) {
      let textError = JSON.parse(error.responseText);
      alertBanner("Error deleting the texture: " + textError.message, false, 'banner-alert');
    }
  });
}

socket.on('delete-texture', function(data) {
  /* Remove the texture from the model */
  let IDModel = data.IDModel;
  let IDTexture = data.IDTexture;
  let model = models.find((item) => item.IDModel === IDModel);
  let index = model.textures.findIndex((item) => item.IDTexture === IDTexture);
  model.textures.splice(index, 1);

  /* Update model in models */
  let indexModel = models.findIndex((item) => item.IDModel === IDModel);
  models[indexModel] = model;

  if (openModelID == IDModel)
    refreshModelBannerContent();
})
let notifyTextureDeletion = function(IDModel, IDTexture) {
  socket.emit('delete-texture', { IDModel: IDModel, IDTexture: IDTexture });
}


/* Default texture */
socket.on('texture-set-default', function(data) {
  let IDModel = data.IDModel;
  $.ajax({
    url: API_ENDPOINTS.model.get.url + IDModel,
    type: API_ENDPOINTS.model.get.method,
    success: function (data) {
      data = JSON.parse(data);

      /* Update model in models */
      let index = models.findIndex((item) => item.IDModel === IDModel);
      models[index] = data;

      /* Refresh the default texture in the DOM */
      changeDefaultTextureDOMUpdate(IDModel, data.defaultTexture.textureID);

      /* If the banner is open, update the banner */
      if (openModelID == IDModel)
        refreshModelBannerContent();
    }, error: function(err) {
      window.location.href = ERROR_SERVER;
    }
  })
})
let notifyTextureSetDefault = function(IDModel, IDTexture) {
  socket.emit('texture-set-default', { IDModel: IDModel, IDTexture: IDTexture });
}

let changeDefaultTextureDOMUpdate = function(modelID, textureID) {
  $("#modelBanner .texture").removeClass("defaultTexture");
  $("#modelBanner .texture[data-id_texture='" + textureID + "']").addClass("defaultTexture");
  for(let i = 0; i < models.length; i++) {
    if(models[i].IDModel == modelID) {
      models[i].defaultTexture.textureID = textureID;
      models[i].defaultTexture.textureExtension = models[i].textures.find((item) => item.IDTexture === textureID).textureExtension;
      break;
    }
  }
  console.log(getSelectedModelID(), modelID);
  if (getSelectedModelID() != modelID) {
    let imgSrc = MODELS_FOLDER + modelID + "/" + textureID + "-"+MODEL_TEXTURE_PREVIEW_NAME+"."+MODEL_TEXTURE_PREVIEW_FORMAT;
    $(".model[data-model_id='" + modelID + "'] .model-img").attr("src", imgSrc);
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
      changeDefaultTextureDOMUpdate(modelID, textureID);
      notifyTextureSetDefault(modelID, textureID);
    },
    error: function (error) {
      let textError = JSON.parse(error.responseText);
      alertBanner("Error changing the default texture: " + textError.message, false, 'banner-alert');
    }
  });
}

/* Banner management */
socket.on('lock-model', function(data) {
  let IDModel = data.IDModel;
  let model = models.find((item) => item.IDModel === IDModel);
  lockedModels.push(model);
})
socket.on('unlock-model', function(data) {
  let IDModel = data.IDModel;
  let model = models.find((item) => item.IDModel === IDModel);
  lockedModels.splice(lockedModels.indexOf(model), 1);
})
let isModelLocked = function(IDModel) {
  return lockedModels.find((item) => item.IDModel === IDModel) !== undefined;
}
let notifyModelLock = function() {
  socket.emit('lock-model', { IDModel: openModelID });
}
let notifyModelUnlock = function() {
  socket.emit('unlock-model', { IDModel: openModelID });
}

function openModelBanner(modelID) {
  /* Save selected model info for later use */
  let selectedModel = models.find((item) => item.IDModel === modelID);  
  openModelID = modelID;
  openModelSelectedModel = selectedModel;

  /* Lock the model */
  notifyModelLock();

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
  /* Unlock the model */
  notifyModelUnlock();

  /* Delete data */
  openModelID = null;
  openModelSelectedModel = null;
  modelLoaded = false;

  /* Hide the banner */
  $("#modelBanner").removeClass("active");
  $("#bannerOverlay").removeClass("active");
  $("#bannerOverlay, .close-banner").off("click");
}

function refreshModelBannerContent() {
  /* Save selected model info for later use */
  let selectedModel = models.find((item) => item.IDModel === openModelID);  
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


/* Active model management */
socket.on('set-active-model', function(data) {
  selectElement(data.IDModel, data.IDTexture, false);
})
socket.on('unset-active-model', function() {
  unsetSelected(false);
})
let notifySetActiveModel = function() {
  socket.emit('set-active-model', { IDModel: getSelectedModelID(), IDTexture: getSelectedTextureID() });
}
let notifyUnsetActiveModel = function() {
  socket.emit('unset-active-model');
}

let getSelectedModelID = function() {
  return selectedElement.modelID;
}

let getSelectedTextureID = function() {
  return selectedElement.IDTexture;
}

let isSelected = function(modelID, IDTexture) {
  return selectedElement.modelID === modelID && selectedElement.IDTexture === IDTexture;
}

let selectElement = function(modelID, IDTexture, isOrigin = true) {
  unsetSelected(false);

  let model = models.find((item) => item.IDModel === modelID);  
  $(`.models > .row > div[data-model_id="${modelID}"]`).addClass("active");
  let modelPreviewURL = MODELS_FOLDER + modelID + "/" + IDTexture + "-"+MODEL_TEXTURE_PREVIEW_NAME+"."+MODEL_TEXTURE_PREVIEW_FORMAT;
  $(`.models > .row > div[data-model_id="${modelID}"] > .card > .model-img`).attr("src", modelPreviewURL);
  
  let texture = model.textures.find((item) => item.IDTexture === IDTexture);
  let textureExtension = texture.extension;
  let texturePreviewURL = MODELS_FOLDER + modelID + "/" + IDTexture + "." + textureExtension;
  $(`.models > .row > div[data-model_id="${modelID}"] > .card > .active-model-texture-img`).attr("src", texturePreviewURL);
  $("#modelBanner .texture[data-id_texture='" + IDTexture + "']").addClass("active");

  selectedElement.modelID = modelID;
  selectedElement.IDTexture = IDTexture;

  /* Send selected model to the server */
  if (isOrigin)
    notifySetActiveModel();
}

let unsetSelected = function(isOrigin = true) {
  $(".models > .row > div").removeClass("active");
  $("#modelBanner .texture").removeClass("active");

  selectedElement.modelID = null;
  selectedElement.IDTexture = null;

  updateDefaultDOMModelPreview();
  
  /* Send unset selected model command to the server */
  if (isOrigin)
    notifyUnsetActiveModel();
}

/* Refresh */
socket.on('refresh', function() {
  if (openModelID !== null)
    notifyModelLock(openModelID);
  if (selectedElement.modelID !== null && selectedElement.IDTexture !== null)
    notifySetActiveModel(selectedElement.IDModel, selectedElement.IDTexture);
})
