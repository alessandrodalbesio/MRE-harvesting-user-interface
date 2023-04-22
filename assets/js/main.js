const DOMAIN = '127.0.0.1:5500/website';

/* Alert management */
$(document).ready(function() {
  var alertTemplate = `<strong class="alert-title"></strong><span class="alert-content"></span><i class="fa-solid fa-xmark close"></i>`;
  $('.alert-banner').addClass("alert d-none").append(alertTemplate);
  $('.alert-banner > .close').click(function() {
    $(this).parent().hide();
  });
});

function alertBanner(message, success = false, bannerID = 'main-alert', disableTimeout = false) {
  if (success) {
    $('#' + bannerID).removeClass("alert-danger");
    $('#' + bannerID).addClass("alert-success");
    $('#' + bannerID + ' > .alert-title').text("Yuppi! ");
  } else {
    $('#' + bannerID).removeClass("alert-success");
    $('#' + bannerID).addClass("alert-danger");
    $('#' + bannerID + ' > .alert-title').text("Error! ");
  }
  $('#' + bannerID + ' > .alert-content').text(message);
  $('#' + bannerID).removeClass('d-none'); /* Show the alert */
  /* Hide the alert after 5 seconds */
  if(!disableTimeout) {
    setTimeout(function() {
      $('#' + bannerID).addClass('d-none');
    }, 5000);
  }
}

/* Hide the alert banner */
function hideAlertBanner(bannerID = 'main-alert') {
  $('#' + bannerID).addClass('d-none'); /* Hide the alert */
}
