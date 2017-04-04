var hackService = angular.module('routerApp');

hackService.factory('hackService', ['$timeout',

  function($timeout) {
    return {
      scrollAnim: scrollAnim,
      bindEscapeModalSeq: bindEscapeModalSeq,
      unbindCustomEvents: unbindCustomEvents,
      bindTabbing: bindTabbing,
      allowSecondModalFocus: allowSecondModalFocus
    }

    function scrollAnim(selector) {
      return setTimeout(function () {
          var elem = $(selector);
          elem.focus();
          // Commented out to remove the scroll action of search results when deleting search log
          //$("html, body").animate({scrollTop: elem.offset().top - 300}, 200); 
      }, 1);
    }

    function bindEscapeModalSeq(modal) {
      $(document).keyup(function(e) {
        // escape key is pressed
        if (e.keyCode == 27) {
          if ($('div.sweet-alert').hasClass('hideSweetAlert')) {
            $(modal).modal('hide');
          } else {
            swal.close();
          }
        }
      });

      return 'keyup';
    }

    function unbindCustomEvents(events) {
      $(document).off(events);
    }

    function bindTabbing(elemsToTab) {
      $(document).keyup(function(e) {
        // tab key is pressed
        if (e.keyCode == 9) {
          var elemToFocus = elemsToTab.shift();
          $(elemToFocus).focus();
          elemsToTab.push(elemToFocus);
          e.preventDefault();
        }
      })
      .keydown(function(e) {
        if (e.keyCode == 9) {
          e.preventDefault();
        }
      })
      .keypress(function(e) {
        if (e.keyCode == 9) {
          e.preventDefault();
        }
      });

      return 'keyup keydown keypress';
    }

    // hack to solve focus problems when sweetalert goes on top of bootstrap modal
    function allowSecondModalFocus() {
      $(document).off('focusin').on('focusin', function(e) {
        e.stopImmediatePropagation();
      });
    }
  }
]);