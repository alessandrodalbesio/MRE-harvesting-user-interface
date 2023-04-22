const VALID_INPUT_TYPES = ["string", "number", "boolean", "object", "function"];
const VALID_INPUT_CLASS = 'is-valid';

function displayInputFeedback(inputID, text) {
    let feedbackDiv = $(inputID).parent().children(".input-feedback");
    removeValidInputClass(inputID);
    feedbackDiv.text(text);
    feedbackDiv.show();
}

function hideInputFeedback(inputID) {
    let feedbackDiv = $(inputID).parent().children(".input-feedback");
    feedbackDiv.hide();
}

function removeValidInputClass(inputID) {
    $(inputID).parent().removeClass(VALID_INPUT_CLASS);
}

function addValidInputClass(inputID) {
    $(inputID).parent().addClass(VALID_INPUT_CLASS);
}

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

function isInputValidColor(inputID, name) {
    let inputValue = $(inputID).val();
    if (inputValue.length !== 7 || inputValue[0] !== '#') {
        displayInputFeedback(inputID, name + " is not a valid color");
        return false;
    }
    hideInputFeedback(inputID);
    return true;
}

function isFileNotUndefined(inputID) {
    let file = $(inputID)[0].files[0];
    if (file === undefined) {
        displayInputFeedback(inputID, "Please select a file");
        return false;
    }
    hideInputFeedback(inputID);
    return true;
}

function isFileValidExtension(inputID, name, expectedExtensions) {
    let file = $(inputID)[0].files[0];
    if (expectedExtensions.indexOf(file.name.split(".").pop().toLowerCase()) == -1) {
        displayInputFeedback(inputID, name + " is not a valid file type");
        return false;
    }
    hideInputFeedback(inputID);
    return true;
}

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