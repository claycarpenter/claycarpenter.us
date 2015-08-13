$(document).ready(function () {
  function contactFormClickHandler (evt) {
    evt.preventDefault();

    var data = {
      name: $('input[name=name]').val().trim(),
      email: $('input[name=email]').val().trim(),
      message: $('textarea[name=message]').val().trim()
    }

    // Simple validation
    if (!data.name.length() || !data.email.length() || !.data.message.length()) {
      $('.contact .message') {
        //
      }
    }

    console.log(data);
  }

  $('.contact .button').on('click', contactFormClickHandler);
})
