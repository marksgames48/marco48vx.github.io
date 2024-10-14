function autocomplete(inp, searchTerms) {
  var currentFocus;
  inp.addEventListener("input", function(e) {
    var itemContainer, item, i, val = this.value;
    closeAllLists();
    if (!val) return false;
    currentFocus = -1;
    itemContainer = document.createElement("div");
    itemContainer.setAttribute("id", this.id + "autocomplete-list");
    itemContainer.setAttribute("class", "autocomplete-items");

    for (i = 0; i < searchTerms.length; i++) {
      var upperVal = val.toUpperCase();
      var spaceVal = " " + upperVal;
      var searchTerm = searchTerms[i];
      var searchHit = searchTerm.toUpperCase().indexOf(upperVal);
      if (searchHit > 0) {
        searchHit = searchTerm.toUpperCase().indexOf(spaceVal) + 1;
        if (searchHit === 0) searchHit = -1;
      }
      if (searchHit > -1) {
        item = document.createElement("div");
        item.innerHTML = searchTerm.substr(0, searchHit);
        item.innerHTML += "<strong>" + searchTerm.substr(searchHit, val.length) + "</strong>";
        item.innerHTML += searchTerm.substr(searchHit + val.length);
        item.innerHTML += "<input type='hidden' value='" + searchTerm + "'>";
        item.addEventListener("click", function(e) {
          inp.value = this.getElementsByTagName("input")[0].value;
          closeAllLists();
          inp.form.submit();
        });
        itemContainer.appendChild(item);
      }
    }
    if (itemContainer.childElementCount > 0) {
      this.parentNode.appendChild(itemContainer);
    }
  });

  inp.addEventListener("keydown", function(e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode === 40) {
      currentFocus++;
      addActive(x);
    } else if (e.keyCode === 38) {
      currentFocus--;
      addActive(x);
    } else if (e.keyCode === 13) {
      e.preventDefault();
      if (currentFocus > -1) {
        if (x) x[currentFocus].click();
      }
      this.form.submit();
    }
  });

  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    x[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(element) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (element != x[i] && element != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

  document.addEventListener("click", function(e) {
    closeAllLists(e.target);
  });
}

autocomplete(document.getElementById("search_field"), mathTerms);
