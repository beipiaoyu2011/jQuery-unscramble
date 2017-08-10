 # .first()

 获取第一个元素   
    
    // f 模拟替代 first
    $.fn.ft = function () {
        return this.equal(0);//沿用我们自定义模拟的equal 代替 eq
    }

    console.log($('.eqUl li').ft().html());