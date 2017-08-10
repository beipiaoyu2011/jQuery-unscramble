
// equal 模拟 eq

$.fn.equal = function (i) {
    i = +i;
    return i === -1 ? this.slice(i) : this.slice(i, i + 1);
};

// console.log($('.eqUl li').equal(0).html());

var eqUl = document.querySelector('.eqUl');
var list = eqUl.querySelectorAll('li');

eqUl.addEventListener('click', function (e) {
    var target = e.target || e.srcElement;
    var index = [].indexOf.call(list, target);
    alert($('.eqUl li').equal(index).html());
}, false);
