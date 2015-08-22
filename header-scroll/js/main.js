var stickyHeaders = (function() {

  var window_obj = jQuery(window); 
  var stickies_obj;

  var load = function(stickies) {

    if (typeof stickies === "object" && stickies instanceof jQuery && stickies.length > 0) {


      stickies_obj = stickies.each(function() {
        var thisSticky = jQuery(this).wrap('<div class="followWrap" />');

        thisSticky
            .data('originalPosition', thisSticky.offset().top)
            .data('originalHeight', thisSticky.outerHeight())
              .parent()
              .height(thisSticky.outerHeight());             
      });

      window_obj.off("scroll.stickies").on("scroll.stickies", function() {
          _whenScrolling();     
      });
    }
  };

  var _whenScrolling = function() {

    stickies_obj.each(function(i) {            

      var thisSticky = jQuery(this),
          stickyPosition = thisSticky.data('originalPosition');

      if (stickyPosition <= window_obj.scrollTop()) {        
        
        var nextSticky = stickies_obj.eq(i + 1),
            nextStickyPosition = nextSticky.data('originalPosition') - thisSticky.data('originalHeight');

        thisSticky.addClass("fixed");

        if (nextSticky.length > 0 && thisSticky.offset().top >= nextStickyPosition) {

          thisSticky.addClass("absolute").css("top", nextStickyPosition);
        }

      } else {
        
        var prevSticky = stickies_obj.eq(i - 1);

        thisSticky.removeClass("fixed");

        if (prevSticky.length > 0 && window_obj.scrollTop() <= thisSticky.data('originalPosition') - thisSticky.data('originalHeight')) {

          prevSticky.removeClass("absolute").removeAttr("style");
        }
      }
    });
  };

  return {
    load: load
  };
})();

jQuery(function() {
  stickyHeaders.load(jQuery(".title"));
});