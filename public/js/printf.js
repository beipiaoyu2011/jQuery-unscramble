window.console = (function () {
    var clog = function (val) {
        document.writeln(val + '<br/>');
    };
    return {
        log: clog
    };
})();