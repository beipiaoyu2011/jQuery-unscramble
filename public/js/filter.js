// filter.js
console.log($('p').filter('.selected'));
console.log($('p').filter('.selected, :first'));
console.log($('p').filter(function () {
    return $('ol', this).length == 0;
}));

// fr模拟 filter
// $.fn.fr = function (selector) {  
//     return this.pushStack(winnow(this, selector, true), 'filter', selector);
// };
// function winnow(elements, qualifer, keep) {
    
// }
// console.log($('p').fr('.selected'));