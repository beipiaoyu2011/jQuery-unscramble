# .hasClass(class)
检查当前的元素是否含有某个特定的类，如果有，则返回true。

	//hs 模拟 hasClass /[\t\r\n]/g 替换换行符 制表符 等
	$.fn.hs = function (selector) {
	    var className = " " + selector + " ",
	        i = 0,
	        l = this.length;
	    for (; i < l; i++) {
	        if (this[i].nodeType === 1 && (" " + this[i].className + " ").replace(/[\t\r\n]/g, " ").indexOf(className) >= 0) {
	            return true;
	        }
	    }
	    return false;
	}
	
	var demo1 = document.querySelector('.hasClassName');
	demo1.onclick = function () {
	    var hs = $('.hasClassName').hs('demo');
	    alert('是否包含demo这个class: ' + hs);
	}