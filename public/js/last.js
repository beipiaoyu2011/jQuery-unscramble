// la 模拟替代 last
$.fn.la = function () {
    return this.equal(-1);//沿用我们自定义模拟的equal 代替 eq
}

console.log($('.eqUl li').la().html());