// $.grep()

var arr = [0, 1, 4];
var arr1 = $.grep(arr, function (n, i) {
    return n > 1;
}, false);
console.log(arr1);
var arr2 = $.grep(arr, function (n, i) {
    return n > 1;
}, true);
console.log(arr2);

//gr 模拟 grep
$.gp = function (arr, callback, inv) {
    var retVal,
        ret = [],
        i = 0,
        len = arr.length;
    inv = !!inv; // null， undefined 转化为 false
    for (; i < len; i++) {
        retVal = !!callback(arr[i], i);
        if (retVal !== inv) {
            ret.push(arr[i]);
        }
    }
    return ret;
};

console.log($.gp(arr, function (n, i) {
    return n > 1;
}, false));
console.log($.gp(arr, function (n, i) {
    return n > 1;
}, true));
