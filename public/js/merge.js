
//$.merge()
//for example
var arr1 = [0, 1, 2],
    arr2 = [2, 3, 4];
// var arr = $.merge(arr1, arr2);//arr1 改变 arr2 不变
// console.log(arr);
//测试代码 1 第二个不一定是数组 只有有length属性即可
var obj = {
    0: 'w',
    1: 'z',
    length: '2'
};
// console.log($.merge(arr1, obj));
//测试代码 2
var obj2 = {
    name: 'wz',
    1: 'master',
    length: 2
};
console.log(typeof obj2.length)
// console.log($.merge(arr1, obj2));

//mg 模拟 merge 优化下 判断不显示undefined
$.mg = function (first, second) {
    var s = second.length,
        f = first.length,
        i = 0;
    if (typeof s === 'number') {
        for (; i < s; i++) {
            if(second[i]) first[f++] = second[i];
        }
    } else {
        while (second[i] !== undefined) {
            first[f++] = second[i++];
        }
    }
    first.length = f;
    return first;
};
console.log($.mg(arr1, obj))
console.log($.mg(arr1, obj2))
