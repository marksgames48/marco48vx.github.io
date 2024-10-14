var form = document.getElementById('validated-form');

//The link mousedown handler doesn't work for the Log in link that is added to page if email already exists
var unloading = false;
window.addEventListener("beforeunload", function(event){
	unloading = true;
});

if (getCookie('email_queue') == 1) {
	var request = new XMLHttpRequest();
	request.open('GET', '/util/send-emails');
	request.send();
	deleteCookie('email_queue');
}

if (form) {
  hide_modal();
  var email_field = document.getElementsByName("email")[0];
  var email_confirm_field = document.getElementsByName("email_confirm")[0];
  var password_field = document.getElementsByName("password")[0];
  var password_confirm_field = document.getElementsByName("password_confirm")[0];
  var agree_field = document.getElementsByName("agree")[0];
  form.addEventListener("submit", function(event){
  	event.preventDefault();
  	if( ! check_all_fields()){
  		return false;
  	} else {
      show_modal();
  		form.submit();
  	}
  });
  window.addEventListener("pageshow", function(event){
  	if (performance.navigation.type === 2) {
  		location.reload();
  	}
  });

  //This allows us to exit the page without getting stuck by the check_field on blur
  var mousedown = false;
  var links = document.querySelectorAll('a');
  for (var i=0; i<links.length; i++) {
    links[i].addEventListener("mousedown", function(event){
      mousedown = true;
      event.preventDefault();
    });
  }
  var submit_button = form.querySelector('button[type="submit"]');
  var possible_fields = ["email","email_confirm","password","password_confirm", "agree"];
  var fields = [];
  var element = null;
  var already_focused = false;
  for (var i=0; i<possible_fields.length; i++) {
    if(element = document.getElementById(possible_fields[i])) {
      fields.push(possible_fields[i]);
      if(( ! already_focused) && element.classList.contains('form-error')) {
        already_focused = true;
        document.getElementsByName(possible_fields[i])[0].focus();
      }
    }
  }
  if ( ! already_focused) {
    for (i = 0; i<fields.length; i++) {
      if (document.getElementsByName(fields[i])[0].value == '') {
        document.getElementsByName(fields[i])[0].focus();
        break;
      }
    }
  }

	var focusable = Array.prototype.slice.call(form.querySelectorAll('button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'));
	document.addEventListener("keydown", function(event){
		index = focusable.indexOf(document.activeElement);
		if (event.which == 9 && ! event.shiftKey) {
			if (index > -1 && index < focusable.length-1) {
				event.preventDefault();
				focusable[index + 1].focus();
			}
		} else if (event.which == 9 && event.shiftKey) {
			if (index > 0 && index < focusable.length) {
				event.preventDefault();
				focusable[index - 1].focus();
			}
		} else if (event.which == 13) {
      if (index < focusable.length-2) {
        event.preventDefault();
        focusable[index + 1].focus();
      }
    }
	});
}

function check_all_fields() {
	var fields_valid = true;
	var field = null;
	for (var i=0; i<fields.length; i++) {
		field = document.getElementsByName(fields[i])[0];
		element = document.getElementById(fields[i]);
    if (element.classList.contains("form-required")) {
			check_field(field, fields[i]);
		}
    if (element.classList.contains("form-error") && fields[i] !== 'email') {
			check_field(field, fields[i]);
		}
	}
	var errors = document.getElementsByClassName('form-error');
	if (errors.length > 0) {
		fields_valid = false;
		for (i=0; i<errors.length; i++) {
			errors[i].classList.add('bounce-left');
		}
    document.getElementsByName(errors[0].id)[0].focus();
	}
	if (document.getElementsByClassName('form-ajax').length > 0) {
		fields_valid = false;
		setTimeout(function(){
      if (submit_button) {
        submit_button.click();
      } else if (stripe_button) {
        stripe_button.click();
      }
		}, 200);
		return false;
	}
	return fields_valid;
}

function check_field(field, id_name) {
  //This allows us to exit the page without getting stuck by the check_field on blur
  if (mousedown) {
    return true;
  }
	if (id_name === 'agree') {
		if ( ! field.checked) {
			setError('agree', '* Please agree to the terms');
			return false;
		} else {
			clearError('agree');
			return true;
		}
	}

	var value = field.value.trim();
	field.value = value;

	if (value === '') {
		setError(id_name, 'Please fill in this field');
		return false;
	} else {
		clearError(id_name);
	}
  if (password_confirm_field) {
    if ((id_name === 'password' || id_name === 'password_confirm') && password_confirm_field.value !== '')  {
      if (password_field.value === password_confirm_field.value) {
        clearError('password_confirm');
      } else {
        setError('password_confirm', 'The Password Confirmation does not match the Password');
      }
    }
  }
  if (email_confirm_field) {
	 if ((id_name === 'email' || id_name === 'email_confirm') && email_confirm_field.value !== '') {
  		if (email_field.value === email_confirm_field.value) {
  			clearError('email_confirm');
  		} else {
  			setError('email_confirm', 'The Email Confirmation does not match the Email');
  		}
  	}
  }
	if (id_name === 'email') {
		document.getElementById(id_name).className = "form-ajax";
		var request = new XMLHttpRequest();
		var check_email = 'email-unique';
		if (document.getElementsByName('check_email').length > 0) {
			check_email = document.getElementsByName('check_email')[0].value;
		}
		request.open('POST', '/ajax/account/' + check_email, true);
		request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		request.onload = function() {
		  if (request.status >= 200 && request.status < 400) {
		    // Success!
		    var data = JSON.parse(request.responseText);
				clearError(id_name);
				if ( ! data.valid) {
					setError(id_name, data.msg);
					setCookie('flash_emailSaved', data.email, 5); //to pre-fill login field if they follow the link
				}
		  } else {
        clearError(id_name);
        alert("There is a problem with the server right now. Please try again later.");
		  }
		};
		request.onerror = function() {
      if( ! unloading) {
  			clearError(id_name);
  			alert("There is a problem with the internet connection right now. Please try again later.");
      }
		};
		request.send('email=' + encodeURIComponent(value));
	}
}

function show_modal() {
  var modal = document.getElementById("processing-modal");
  if (modal) {
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
  }
}

function hide_modal() {
  var modal = document.getElementById("processing-modal");
  if (modal) {
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";
  }
}

function toggleContent(elem, id) {
	elem.blur();
	var content = document.getElementById(id);
	if (content.classList.contains('hidden')) {
		content.classList.remove('hidden');
		elem.innerHTML = 'Show Less';
	} else {
		content.classList.add('hidden');
		elem.innerHTML = 'Show More';
	}
}

function markRead(id) {
	var content = document.getElementById(id);
	content.remove();
	setCookie(id, 'read', 365*24*60);
}

function setError(id_name, message) {
	var icon = document.getElementById(id_name);
	var message_div = document.getElementById(id_name + "-msg");
	icon.className = "form-error";
	message_div.innerHTML = message;
}

function clearError(id_name) {
	var icon = document.getElementById(id_name);
	var message_div = document.getElementById(id_name + "-msg");
	icon.className = "";
	message_div.innerHTML = "";
}

function setCookie(cname, cvalue, exmins) {
  var d = new Date();
  d.setTime(d.getTime() + (exmins*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function deleteCookie(cname) {
	setCookie(cname, '', -60);
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
