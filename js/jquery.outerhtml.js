// jQuery plugin: jquery.outerhtml.js
(function($) {
  $.extend({
    outerHTML: function() {
      var $ele = arguments[0],
        args = Array.prototype.slice.call(arguments, 1);
      if ($ele && !($ele instanceof jQuery) && (typeof $ele == 'string' || $ele instanceof HTMLCollection || $ele instanceof Array)) $ele = $($ele);
      if ($ele.length) {
        if ($ele.length == 1) return $ele[0].outerHTML;
        else return $.map($("div"), function(ele, i) {
          return ele.outerHTML;
        });
      }
      throw new Error("Invalid Selector");
    }
  })
  $.fn.extend({
    outerHTML: function() {
      var args = [this];
      if (arguments.length)
        for (x in arguments) args.push(arguments[x]);
      return $.outerHTML.apply($, args);
    }
  });
})(jQuery);