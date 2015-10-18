$(document).ready(function(){

$(".magnify").mousemove(function (e) {
        var magnify_offset = $(this).offset(),
            mx = e.pageX - magnify_offset.left,
            my = e.pageY - magnify_offset.top;

        // fade out the magnifying glass if the mouse is outside the container
        if (mx < $(this).width() && my < $(this).height() && mx > 0 && my > 0) {
            $(".mag-glass").fadeIn(100);
            $(".sig-large").fadeIn(100);
        }
        else {
            $(".mag-glass").fadeOut(100);
            $(".sig-large").fadeOut(100);
        }

        if ($(".mag-glass").is(":visible")) {
            // background position of .large changes based on mouse position
            var rx = Math.round(mx - $(".mag-glass").width() / 2) * -1,
                ry = Math.round(my - $(".mag-glass").height() / 2) * -1;
            var bgpx = (rx * 3 - 70) + "px",
                bgpy = (ry - 5) + "px";

            // move magnifying glass and larger background zoom div with the mouse
            var px = mx - $(".mag-glass").width() / 2,
                py = my - $(".mag-glass").height() / 2;

            $(".mag-glass").css({ left: px, top: py });
            $(".sig-large").css({ left: bgpx, top: bgpy });
        }
    });
});