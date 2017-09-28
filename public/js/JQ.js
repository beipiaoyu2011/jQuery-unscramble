(function (window, undefined) {
    var
        // The deferred used on DOM ready
        // 一个用在 DOM ready 上的回调函数处理变量
        readyList,

        // A central reference to the root jQuery(document)
        // 所有 jQuery 对象最后的指向应该都是回到 jQuery(document)
        rootjQuery,

        // Support: IE<10
        // For `typeof xmlNode.method` instead of `xmlNode.method !== undefined`
        // 将 undefined 转换为字符串 "undefined"
        core_strundefined = typeof undefined,

        // Use the correct document accordingly with window argument (sandbox)
        // 通过闭包函数传入的 window 对象，避免 document 之类的全局变量被其他插件修改
        location = window.location,
        document = window.document,
        docElem = document.documentElement,

        // Map over jQuery in case of overwrite
        // 设置别名，通过两个私有变量映射了 window 环境下的 jQuery 和 $ 两个对象，以防止变量被强行覆盖
        _jQuery = window.jQuery,

        // Map over the $ in case of overwrite
        // 设置别名，同上所述
        _$ = window.$,

        // [[Class]] -> type pairs
        // 储存了常见类型的 typeof 的哈希表
        // Boolean Number String Function Array Date RegExp Object Error
        // 其次，这里定义了一个空对象 {} ，如果下文行文需要调用对象的 toString 和 hasOwnProperty 方法
        // 将会调用 core_toString 和 core_hasOwn ，这两个变量事先存储好了这两个方法的入口
        // 节省查找内存地址时间，提高效率
        class2type = {},

        // 定义当前版本
        // 其次，这里定义了一个字符串对象 ，如果下文行文需要调用字符串对象的 trim 方法
        // 将会调用 core_trim ，这个变量事先存储好了 String.trim 方法的入口
        // 节省查找内存地址时间，提高效率
        core_version = "1.10.2",

        // List of deleted data cache ids, so we can reuse them
        // 其次，这里定义了一个空的数组对象 ，如果下文行文需要调用数组对象的 concat 、push 、slice 、indexOf 方法
        // 将会调用 core_concat 、core_push 、core_slice 、和 core_indexOf ，这四个变量事先存储好了这四个方法的入口
        // 节省查找内存地址时间，提高效率
        // 同时使用 call 或 apply 调用这些方法也可以使类数组也能用到数组的方法
        core_deletedIds = [],

        // Save a reference to some core methods
        // 定义这几个变量的作用如上所述
        // 存储了一些常用的核心方法
        core_concat = core_deletedIds.concat,
        core_push = core_deletedIds.push,
        core_slice = core_deletedIds.slice,
        core_indexOf = core_deletedIds.indexOf,
        core_toString = class2type.toString,
        core_hasOwn = class2type.hasOwnProperty,
        core_trim = core_version.trim,

        // Define a local copy of jQuery
        // 实例化 jQuery 对象 ,selector 是选择器，context 是上下文
        // 用法：$('#xxx') || $('<div></div>', { class: 'css-class', data-name: 'data-val' });
        jQuery = function (selector, context) {
            // The jQuery object is actually just the init constructor 'enhanced'
            // jQuery 没有使用 new 运算符将 jQuery 显示的实例化，而是直接调用其函数
            // 要实现这样,那么 jQuery 就要看成一个类，且返回一个正确的实例
            // 且实例还要能正确访问 jQuery 类原型上的属性与方法
            // 通过原型传递解决问题，把 jQuery 的原型传递给jQuery.prototype.init.prototype
            // jQuery.fn.init.prototype = jQuery.fn;
            // 所以通过这个方法生成的实例 this 所指向的 仍然是 jQuery.fn(jQuery.prototype)，所以能正确访问 jQuery 类原型上的属性与方法
            // http://rapheal.sinaapp.com/2013/01/31/jquery-src-obj/
            return new jQuery.fn.init(selector, context, rootjQuery);
        },

        // Used for matching numbers
        // 匹配数字
        // 第一个分组 (?:\d*\.|) 匹配 数字后面接一个小数点. 例如 123. 456. 或者空（注意正则最后的|）
        // 第二个分组 (?:[eE][+-]?\d+|) 匹配 e+10 或者 E-10 这样的指数表达式 或空
        // 需要注意的是 [+-]? 表示可匹配 +- 0 次或者 1 次，
        // (?:\d*\.|) 可匹配空
        // (?:[eE][+-]?\d+|) 可匹配空
        // 所以这个正则表达式的核心匹配是 /\d+/ 匹配数字一次或者多次
        core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

        // Used for splitting on whitespace
        // \S -- 匹配任意不是空白符的字符
        core_rnotwhite = /\S+/g,

        // Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
        // 匹配头尾空格，确保去除 BOM 和 $nbsp;
        // | 分割的两部分是一样，分别匹配头尾的空格
        // 最快的trim方法请看：http://www.cnblogs.com/rubylouvre/archive/2009/09/18/1568794.html
        rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

        // A simple way to check for HTML strings
        // Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
        // Strict HTML recognition (#11290: must start with <)
        // 一个简单的检测HTML字符串的表达式
        // 要看懂 jQuery 中的正则匹配，还必须深入理解 exec() 方法
        rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

        // Match a standalone tag
        // 这个正则匹配的是 纯HTML标签,不带任何属性 ，如 '<html></html>' 或者 '<img/>'
        // rsingleTag.test('<html></html>') --> true
        // rsingleTag.test('<img/>') --> true
        // rsingleTag.test('<div class="foo"></div>') --> false
        rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

        // JSON RegExp
        rvalidchars = /^[\],:{}\s]*$/,
        rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
        rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
        rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,

        // Matches dashed string for camelizing
        // 匹配 -ms- 前缀
        rmsPrefix = /^-ms-/,

        // [\da-z] 表示任意英文字母或者数字
        rdashAlpha = /-([\da-z])/gi,

        // Used by jQuery.camelCase as callback to replace()
        // 在 jQuery.camelCase() 中会用到
        // 驼峰表示法，将 font-size 形式转化为 fontSize
        // function camelCase(string){
        // 	return string.replace(/-([a-z])/g,function(all,letter){
        // 		return letter.toUpperCase();
        // 	})
        // }
        fcamelCase = function (all, letter) {
            return letter.toUpperCase();
        },
        // The ready event handler
        completed = function (event) {
            // readyState === "complete" is good enough for us to call the dom ready in oldIE
            if (document.addEventListener || event.type === "load" || document.readyState === "complete") {
                detach();
                jQuery.ready();
            }
        },
        // Clean-up method for dom ready events
        detach = function () {
            if (document.addEventListener) {
                document.removeEventListener("DOMContentLoaded", completed, false);
                window.removeEventListener("load", completed, false);

            } else {
                document.detachEvent("onreadystatechange", completed);
                window.detachEvent("onload", completed);
            }
        };

    // 给 jQuery.prototype 设置别名 jQuery.fn
    // jQuery.prototype 即是 jQuery的原型，挂载在 jQuery.prototype 上的方法，即可让所有 jQuery 对象使用
    jQuery.fn = jQuery.prototype = {
        // The current version of jQuery being used
        // 当前版本
        jquery: core_version,

        // 构造函数
        // 相当于 jQuery.prototype.constructor = jQuery
        // 由于采用对象字面量的方式 jQuery.prototype = {} 重写了 jQuery.prototype
        // 如果不加上下面这句，jQuery.prototype.constructor 将指向 Object，
        // 为了严谨，可以在使用 jQuery.prototype = {} 重写整个 jQuery.prototype 的时候
        // 加上此句，手动让 jQuery.prototype.constructor 指回 jQuery
        // 如果采用 jQuery.prototype.init = function(){} 的方法一个一个新增原型方法
        // 则不需要添加下面这句， jQuery.prototype.constructor 默认指向 jQuery
        // 更为详细的原因可以看看高程3第六章
        constructor: jQuery,

        // 初始化方法
        // 即 构造jQuery对象实际上最后是调用这个方法(new jQuery.fn.init( selector, context, rootjQuery ) )
        // $('#xxx') -> new jQuery('#xxx')
        // 这个方法可以称作 jQuery对象构造器
        init: function (selector, context, rootjQuery) {
            var match, elem;

            // HANDLE: $(""), $(null), $(undefined), $(false)
            // 如果传入的参数为空，则直接返回this
            // 处理"",null,undefined,false,返回this ，增加程序的健壮性
            if (!selector) {
                return this;
            }

            // Handle HTML strings
            // 处理字符串
            if (typeof selector === "string") {
                // 下面这个 if 条件判断是先给 match 变量赋值
                // if 条件相当于这个正则式 /^<\.+>$/
                // 也就是以  "<"开始，">"结尾，且长度大于等于3 ，
                // ex. <p> <html>
                if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
                    // Assume that strings that start and end with <> are HTML and skip the regex check
                    // 如果selector是html标签组成的话，match的组成直接如下
                    // match[1] = selecetor 即匹配的是 (<[\w\W]+>)
                    match = [null, selector, null];

                    // 并非是以  "<"开始，">"结尾
                } else {
                    // 使用 exec 处理 selector ，得到数组match
                    // rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/ 简单的检测 HTML 字符串的表达式
                    match = rquickExpr.exec(selector);
                }

                // Match html or make sure no context is specified for #id
                // 匹配的html或确保没有上下文指定为# id
                if (match && (match[1] || !context)) {

                    // HANDLE: $(html) -> $(array)
                    // match[1] 为 true 的情况，是上面的这一句 match = [ null, selector, null ]
                    if (match[1]) {
                        // 传入上下文
                        context = context instanceof jQuery ? context[0] : context;

                        // scripts is true for back-compat
                        // 合并两个数组内容到第一个数组
                        // jQuery.parseHTML -> 使用原生的DOM元素的创建函数，将字符串转换为DOM元素数组，然后可以插入到文档中
                        jQuery.merge(this, jQuery.parseHTML(
                            match[1],
                            context && context.nodeType ? context.ownerDocument || context : document,
                            true
                        ));

                        // HANDLE: $(html, props)
                        // 这个 if 语句的作用是当 传入的selector 是纯 HTML 标签，且 context 不为空，相当于
                        // var jqHTML = $('<div></div>', { class: 'css-class', data-name: 'data-val' });
                        // console.log(jqHTML.attr('class')); //css-class
                        // console.log(jqHTML.attr('data-name')); //data-val
                        // rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/
                        // 上面这个正则匹配的是 纯HTML标签,不带任何属性 ，如 '<html></html>' 或者 '<img/>'
                        // rsingleTag.test('<html></html>') --> true
                        // rsingleTag.test('<img/>') --> true
                        // rsingleTag.test('<div class="foo"></div>') --> false
                        // jQuery.isPlainObject 用于测试是否为纯粹的对象
                        // 纯粹的对象指的是 通过 "{}" 或者 "new Object" 创建的
                        if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                            for (match in context) {
                                // Properties of context are called as methods if possible
                                if (jQuery.isFunction(this[match])) {
                                    this[match](context[match]);

                                    // ...and otherwise set as attributes
                                } else {
                                    this.attr(match, context[match]);
                                }
                            }
                        }

                        return this;

                        // HANDLE: $(#id)
                        // 处理id -> $('#id')
                        // 反之，match[1]为false 的情况下，是上面的 match = rquickExpr.exec( selector )
                    } else {
                        // match[2] 是匹配到的 id 名
                        elem = document.getElementById(match[2]);

                        // Check parentNode to catch when Blackberry 4.6 returns
                        // nodes that are no longer in the document #6963
                        if (elem && elem.parentNode) {
                            // Handle the case where IE and Opera return items
                            // by name instead of ID
                            if (elem.id !== match[2]) {
                                // 调用 Sizzle 引擎进行更复杂的选择器查找
                                return rootjQuery.find(selector);
                            }

                            // Otherwise, we inject the element directly into the jQuery object
                            this.length = 1;
                            this[0] = elem;
                        }

                        this.context = document;
                        this.selector = selector;
                        return this;
                    }

                    // HANDLE: $(expr, $(...))
                    // 如果第一个参数是一个.className ，第二参数为一个选择器
                } else if (!context || context.jquery) {
                    // rootjQuery 相当于 jQuery(document)
                    // 下面的 return 相当于 $(context).find( selector )
                    // (如果 context 为空) jQuery(document).find( selector )
                    // 调用 Sizzle 引擎进行更复杂的选择器查找
                    return (context || rootjQuery).find(selector);

                    // HANDLE: $(expr, context)
                    // (which is just equivalent to: $(context).find(expr)
                    // 如果第一个参数是.className，第二个参数是一个上下文对象
                    // 等同于处理$(.className .className)
                } else {
                    // this.constructor 即是 jQuery
                    // this.constructor( context ).find( selector ) -> jQuery(context).find(selector)
                    // 调用 Sizzle 引擎进行更复杂的选择器查找
                    return this.constructor(context).find(selector);
                }

                // HANDLE: $(DOMElement)
                // 处理DOMElement,返回修改过后的this
            } else if (selector.nodeType) {
                this.context = this[0] = selector;
                this.length = 1;
                return this;

                // HANDLE: $(function)
                // Shortcut for document ready
                // 处理$(function(){})
            } else if (jQuery.isFunction(selector)) {
                return rootjQuery.ready(selector);
            }
            // 匹配选择器里嵌套了一个选择器
            // $($('#container')) 相当于 $('#container')
            if (selector.selector !== undefined) {
                this.selector = selector.selector;
                this.context = selector.context;
            }
            return jQuery.makeArray(selector, this);
        },

        // Start with an empty selector
        selector: "",

        // The default length of a jQuery object is 0
        // jQuery 对象的默认长度为 0
        // jQuery 对象里边选取的DOM节点数目，有了这个属性就已经像“半个”数组了，:)
        length: 0,

        // 将 jQuery 对象转换成数组类型，这里返回的结果就真的是 Array 类型了
        // 相当于 Array.prototype.slice.call(this)
        // slice() 方法：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
        toArray: function () {
            return core_slice.call(this);
        },

        // Get the Nth element in the matched element set OR
        // Get the whole matched element set as a clean array
        // 如果 num 不为 null ，将返回索引为 num 的元素
        // （否则）返回索引为 num 的 jQuery 对象
        // 当 num 为负数的时候，相当于从数组尾巴倒数索引
        get: function (num) {
            return num == null ?
                //return a clear array
                this.toArray() :
                //return just the object
                //负数则反向取
                (num >= 0) ? this[num] : this[this.length + num]
        },

        // Take an array of elements and push it onto the stack
        // (returning the new matched element set)
        // 将一个 DOM 元素集合加入到 jQuery 栈
        // 此方法在 jQuery 的 DOM 操作中被频繁的使用, 如在 parent(), find(), filter() 中
        // pushStack() 方法通过改变一个 jQuery 对象的 prevObject 属性来跟踪链式调用中前一个方法返回的 DOM 结果集合
        // 当我们在链式调用 end() 方法后, 内部就返回当前 jQuery 对象的 prevObject 属性
        pushStack: function (elems) {

            // Build a new jQuery matched element set
            // 构建一个新的jQuery对象，无参的 this.constructor()，只是返回引用 this
            // jQuery.merge 把 elems 节点，合并到新的 jQuery 对象
            // this.constructor 就是 jQuery 的构造函数 jQuery.fn.init，所以 this.constructor() 返回一个 jQuery 对象
            // 由于 jQuery.merge 函数返回的对象是第二个函数附加到第一个上面，所以 ret 也是一个 jQuery 对象，这里可以解释为什么 pushStack 出入的 DOM 对象也可以用 CSS 方法进行操作
            // 返回的对象的 prevObject 属性指向上一个对象，所以可以通过这个属性找到栈的上一个对象
            var ret = jQuery.merge(this.constructor(), elems);

            // Add the old object onto the stack (as a reference)
            // 给返回的新 jQuery 对象添加属性 prevObject
            // 所以也就是为什么通过 prevObject 能取到上一个合集的引用了
            ret.prevObject = this;
            ret.context = this.context;

            // Return the newly-formed element set
            return ret;
        },

        // Execute a callback for every element in the matched set.
        // (You can seed the arguments with an array of args, but this is
        // only used internally.)
        // 具体实现
        each: function (callback, args) {
            return jQuery.each(this, callback, args);
        },

        // 可以看出 ready 回调是绑定在 jQuery 的实例上的
        // $(document).ready(fn)
        // $("#id").ready(fn)
        // 都调用此处
        ready: function (fn) {
            // Add the callback
            // 这里的 jQuery.ready.promise() 返回异步队列
            // 调用异步队列的 done 方法，把 fn 回调加入成功队列里边去
            jQuery.ready.promise().done(fn);

            // 支持jQuery的链式操作
            return this;
        },

        // 构建一个新的jQuery对象数组，并可以回溯回上一个对象
        slice: function () {
            return this.pushStack(core_slice.apply(this, arguments));
        },

        // 取当前 jQuery 对象的第一个
        first: function () {
            return this.eq(0);
        },

        // 取当前 jQuery 对象的最后一个
        last: function () {
            return this.eq(-1);
        },

        // 取当前 jQuery 对象的第 i 个
        eq: function (i) {
            var len = this.length,
                j = +i + (i < 0 ? len : 0);
            return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
        },

        map: function (callback) {
            return this.pushStack(jQuery.map(this, function (i, elem) {
                return callback.call(elem, i, elem);
            }));
        },

        // 回溯链式调用的上一个对象
        // $("#id").find('.clr').html('.clr HTML').end().html('#id HTML')
        // 本来 find 函数已经使得链的上下文切换到 .clr 这个 jQ 对象了，为了最后能回到 #id 这个 jQ 对象
        // 可以使用 end 方法来返回
        // 这里的秘籍就是每个对象里边的 prevObject 保存着链中的上一个 jQ 对象
        end: function () {
            // 回溯的关键是返回 prevObject 属性
            // 而 prevObject 属性保存了上一步操作的 jQuery 对象集合
            return this.prevObject || this.constructor(null);
        },

        // For internal use only.
        // Behaves like an Array's method, not like a jQuery method.
        // 仅在内部使用
        push: core_push,
        sort: [].sort,
        splice: [].splice
    };

    // Give the init function the jQuery prototype for later instantiation
    // jQuery 没有使用 new 运算符将 jQuery 显示的实例化，而是直接调用其函数
    // 要实现这样,那么 jQuery 就要看成一个类，且返回一个正确的实例
    // 且实例还要能正确访问 jQuery 类原型上的属性与方法
    // 通过原型传递解决问题，把 jQuery 的原型传递给jQuery.prototype.init.prototype
    // jQuery.fn.init.prototype = jQuery.fn;
    // 所以通过这个方法生成的实例 this 所指向的 仍然是 jQuery.fn(jQuery.prototype)，所以能正确访问 jQuery 类原型上的属性与方法
    jQuery.fn.init.prototype = jQuery.fn;

    // 扩展合并函数
    // 合并两个或更多对象的属性到第一个对象中，jQuery 后续的大部分功能都通过该函数扩展
    // 虽然实现方式一样，但是要注意区分用法的不一样，那么为什么两个方法指向同一个函数实现，但是却实现不同的功能呢,
    // 阅读源码就能发现这归功于 this 的强大力量
    // 如果传入两个或多个对象，所有对象的属性会被添加到第一个对象 target
    // 如果只传入一个对象，则将对象的属性添加到 jQuery 对象中，也就是添加静态方法
    // 用这种方式，我们可以为 jQuery 命名空间增加新的方法，可以用于编写 jQuery 插件
    // 如果不想改变传入的对象，可以传入一个空对象：$.extend({}, object1, object2);
    // 默认合并操作是不迭代的，即便 target 的某个属性是对象或属性，也会被完全覆盖而不是合并
    // 如果第一个参数是 true，则是深拷贝
    // 从 object 原型继承的属性会被拷贝，值为 undefined 的属性不会被拷贝
    // 因为性能原因，JavaScript 自带类型的属性不会合并

    jQuery.extend = jQuery.fn.extend = function () {
        var src, copyIsArray, copy, name, options, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;
        // Handle a deep copy situation
        // target 是传入的第一个参数
        // 如果第一个参数是布尔类型，则表示是否要深递归，
        if (typeof target === 'boolean') {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            // 如果传了类型为 boolean 的第一个参数，i 则从 2 开始
            i = 2;
        }
        // Handle case when target is a string or something (possible in deep copy)
        // 如果传入的第一个参数是 字符串或者其他
        if (typeof target !== 'object' || !jQuery.isFunction(target)) {
            target = {};
        }

        // extend jQuery itself if only one argument is passed
        // 如果参数的长度为 1 ，表示是 jQuery 静态方法
        if (length == i) {
            target = this;
            --i;
        }

        // 可以传入多个复制源
        // i 是从 1或2 开始的
        for (; i < length; i++) {
            // Only deal with non-null/undefined values
            // 将每个源的属性全部复制到 target 上
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    // src 是源（即本身）的值
                    // copy 是即将要复制过去的值
                    src = target[name];
                    copy = options[name];
                    // Prevent never-ending loop
                    // 防止有环，例如 extend(true, target, {'target':target});
                    if (target === copy) {
                        continue;
                    }
                    // Recurse if we're merging plain objects or arrays
                    // 这里是递归调用，最终都会到下面的 else if 分支
                    // jQuery.isPlainObject 用于测试是否为纯粹的对象
                    // 纯粹的对象指的是 通过 "{}" 或者 "new Object" 创建的
                    // 如果是深复制
                    if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                        //数组
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && jQuery.isArray(src) ? src : [];
                            //对象
                        } else {
                            clone = src && jQuery.isPlainObject(src) ? src : {};
                        }
                        // Never move original objects, clone them
                        // 递归
                        target[name] = $.extend(deep, clone, copy);

                        // Don't bring in undefined values
                        // 最终都会到这条分支
                        // 简单的值覆盖
                    } else if (copy != undefined) {
                        target[name] = copy;
                    }

                }
            }
        }
        // Return the modified object
        // 返回新的 target
        // 如果 i < length ，是直接返回没经过处理的 target，也就是 arguments[0]
        // 也就是如果不传需要覆盖的源，调用 $.extend 其实是增加 jQuery 的静态方法
        return target;
    };

    // 一些工具函数，区分 jQuery.extend(object) 和 jQuery.fn.extend(object) 区别
    // jQuery.extend(object) 为扩展 jQuery 类本身，为类添加新的方法。
    // jQuery.fn.extend(object) 给 jQuery 对象添加方法
    jQuery.extend({
        // Unique for each copy of jQuery on the page
        // Non-digits removed to match rinlinejQuery
        // 产生jQuery随机数 类似于： "jQuery044958585570566356"
        expando: 'jQuery' + (core_version + Math.random()).replace(/\D/g, ''),

        // noConflict() 方法让出变量 $ 的 jQuery 控制权，这样其他脚本就可以使用它了
        // 通过全名替代简写的方式来使用 jQuery
        // deep -- 布尔值。指示是否允许彻底将 jQuery 变量还原(移交 $ 引用的同时是否移交 jQuery 对象本身)
        // 让出 jQuery $ 的控制权不代表不能在 jQuery 使用 $ ，方法如下 （）
        //
        //	var query = jQuery.noConflict(true);
        //
        // (function($) {
        //
        //     // 插件或其他形式的代码，也可以将参数设为 jQuery
        //  })(query);
        //
        //  ... 其他用 $ 作为别名的库的代码
        //
        noConflict: function (deep) {
            // 判断全局 $ 变量是否等于 jQuery 变量
            // 如果等于，则重新还原全局变量 $ 为 jQuery 运行之前的变量（存储在内部变量 _$ 中）
            if (window.$ === jQuery) {
                // 此时 jQuery 别名 $ 失效
                window.$ = _$;
            }
            // 当开启深度冲突处理并且全局变量 jQuery 等于内部 jQuery，则把全局 jQuery 还原成之前的状况
            if (deep && window.jQuery === jQuery) {
                // 如果 deep 为 true，此时 jQuery 失效
                window.jQuery = _jQuery;
            }

            // 这里返回的是 jQuery 库内部的 jQuery 构造函数（new jQuery.fn.init()）
            // 像使用 $ 一样尽情使用它吧
            return jQuery;
        },

        // Is the DOM ready to be used? Set to true once it occurs.
        // DOM ready 是否已经完成
        isReady: false,

        // A counter to track how many items to wait for before
        // the ready event fires. See #6781
        // 控制有多少个 holdReady 事件需要在 Dom ready 之前执行
        readyWait: 1,

        // Hold (or release) the ready event
        // 方法允许调用者延迟 jQuery 的 ready 事件
        // example. 延迟就绪事件，直到已加载的插件。
        //
        // $.holdReady(true);
        // $.getScript("myplugin.js", function() {
        //   $.holdReady(false);
        // });
        //
        holdReady: function (hold) {
            if (hold) {
                jQuery.readyWait++;
            } else {
                jQuery.ready(true);
            }
        },

        // Handle when the DOM is ready

        ready: function (wait) {
            // Abort if there are pending holds or we're already ready
            // 如果需要等待，holdReady()的时候，把hold住的次数减1，如果还没到达0，说明还需要继续hold住，return掉
            // 如果不需要等待，判断是否已经Ready过了，如果已经ready过了，就不需要处理了。异步队列里边的done的回调都会执行了
            if (wait == true ? --jQuery.readyWait : jQuery.isReady) {
                return;
            }

            // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
            // 确定 body 存在
            if (!document.body) {
                // 如果 body 还不存在 ，DOMContentLoaded 未完成，此时
                // 将 jQuery.ready 放入定时器 setTimeout 中
                // 不带时间参数的 setTimeout(a) 相当于 setTimeout(a,0)
                // 但是这里并不是立即触发 jQuery.ready
                // 由于 javascript 的单线程的异步模式
                // setTimeout(jQuery.ready) 会等到重绘完成才执行代码，也就是 DOMContentLoaded 之后才执行 jQuery.ready
                // 所以这里有个小技巧：在 setTimeout 中触发的函数, 一定会在 DOM 准备完毕后触发
                return setTimeout(jQuery.ready);
            }

            // Remember that the DOM is ready
            // 记录 DOM ready 已经完成
            jQuery.isReady = true;

            // If a normal DOM Ready event fired, decrement, and wait if need be
            // wait 为 false 表示ready事情未触发过，否则 return
            if (wait !== true && --jQuery.readyWait > 0) {
                return;
            }
            // If there are functions bound, to execute
            // 调用异步队列，然后派发成功事件出去（最后使用done接收，把上下文切换成document，默认第一个参数是jQuery。
            readyList.resolveWith(document, [jQuery]);

            // Trigger any bound ready events
            // 最后jQuery还可以触发自己的ready事件
            // 例如：
            //    $(document).on('ready', fn2);
            //    $(document).ready(fn1);
            // 这里的fn1会先执行，自己的ready事件绑定的fn2回调后执行
            if (jQuery.fn.trigger) {
                jQuery(document).trigger("ready").off("ready");
            }
        },
        // See test/unit/core.js for details concerning isFunction.
        // Since version 1.3, DOM methods and functions like alert
        // aren't supported. They return false on IE (#2968).
        // 判断传入对象是否为 function
        isFunction: function (obj) {
            return jQuery.type(obj) === 'funciton';
        },
        // 判断传入对象是否为数组
        isArray: Array.isArray || function (obj) {
            return jQuery.type(obj) === 'array';
        },
        // 判断传入对象是否为 window 对象
        isWindow: function (obj) {
            /* jshint eqeqeq: false */
            return obj != null && obj == obj.window;
        },
        // 确定它的参数是否是一个数字
        isNumeric: function (obj) {
            return !isNaN(obj) && isFinite(obj);
        },
        // 确定JavaScript 对象的类型
        // 这个方法的关键之处在于 class2type[core_toString.call(obj)]
        // 可以使得 typeof obj 为 "object" 类型的得到更进一步的精确判断
        type: function (obj) {
            // null
            if (obj === null) {
                return String(obj);
            }
            // 利用事先存好的 hash 表 class2type 作精准判断
            return typeof obj === "object" || typeof obj === "function" ?
                class2type[core_toString.call(obj)] || "object" :
                typeof obj;
        },
        // 测试对象是否是纯粹的对象
        // 通过 "{}" 或者 "new Object" 创建的
        isPlainObject: function (obj) {
            var key;
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if (!obj || jQuery.type(obj) !== 'object' || obj.nodeType || jQuery.isWindow(obj)) {
                return falase;
            }

            try {
                // Not own constructor property must be Object
                if (obj.constructor && !core_hasOwn.call(obj, 'constructor') && !core_hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
                    return false;
                }
            } catch (error) {
                // IE8,9 Will throw exceptions on certain host objects #9897
                return false;
            }
            // Support: IE<9
            // Handle iteration over inherited properties before own properties.
            if (jQuery.support.ownLast) {
                for (key in obj) {
                    return core_hasOwn.call(obj, key);
                }
            }

            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.
            for (key in obj) { }

            return key === undefined || core_hasOwn.call(obj, key);
        },

        // 检查对象是否为空（不包含任何属性）
        isEmptyObject: function (obj) {
            var name;
            for (name in obj) {//没有键值直接跳出
                return false;
            }
            return true;
        },

        // 为 JavaScript 的 "error" 事件绑定一个处理函数
        error: function (msg) {
            throw new Error(msg);
        },

        // data: string of html
        // context (optional): If specified, the fragment will be created in this context, defaults to document
        // keepScripts (optional): If true, will include scripts passed in the html string
        // 将字符串解析到一个 DOM 节点的数组中
        // data -- 用来解析的HTML字符串
        // context -- DOM元素的上下文，在这个上下文中将创建的HTML片段
        // keepScripts  -- 一个布尔值，表明是否在传递的HTML字符串中包含脚本
        parseHTML: function (data, context, keepScripts) {
            // 传入的 data 不是字符串，返回 null
            if (!data || typeof data !== 'string') {
                return null;
            }

            // 如果没有传上下文参数
            // function(data,keepScripts)
            if (typeof context == 'boolean') {
                keepScripts = context;
                context = false;
            }

            //没有上下文 默认document
            context = context || document;

            // rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/;
            // 上面这个正则匹配的是 纯HTML标签,不带任何属性 ，如 '<html></html>' 或者 '<img/>'
            // rsingleTag.test('<html></html>') --> true
            // rsingleTag.test('<img/>') --> true
            // rsingleTag.test('<div class="foo"></div>') --> false
            var parsed = rsingleTag.exec(data),
                scripts = !keepScripts && [];

            // Single tag
            // 单个标签，如果捕获的 div 相当于
            // return document.createElement('div');
            if (parsed) {
                return [context.createElement(parsed[1])];
            }

            parsed = jQuery.buildFragment([data], context, scripts);
            if (scripts) {
                jQuery(scripts).remove();
            }
            return jQuery.merge([], parsed.childNodes);
        },

        // 解析 JSON 字符串
        parseJSON: function (data) {
            // Attempt to parse using the native JSON parser first
            if (window.JSON && window.JSON.parse) {
                return window.JSON.parse(data);
            }

            if (data === null) {
                return data;
            }

            if (typeof data === 'string') {
                // Make sure leading/trailing whitespace is removed (IE can't handle it)
                data = jQuery.trim(data);
                if (data) {
                    // Make sure the incoming data is actual JSON
                    // Logic borrowed from http://json.org/json2.js
                    if (rvalidchars.test(data.replace(rvalidescape, "@")
                        .replace(rvalidtokens, "]")
                        .replace(rvalidbraces, ""))) {
                        return (new Function("return " + data))();
                    }
                }
            }
            jQuery.error("Invalid JSON: " + data);
        },

        // Cross-browser xml parsing
        parseXML: function (data) {
            var xml, tmp;
            if (!data || typeof data !== "string") {
                return null;
            }
            try {
                if (window.DOMParser) { // Standard
                    tmp = new DOMParser();
                    xml = tmp.parseFromString(data, "text/xml");
                } else { // IE
                    xml = new ActiveXObject("Microsoft.XMLDOM");
                    xml.async = "false";
                    xml.loadXML(data);
                }
            } catch (e) {
                xml = undefined;
            }
            if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
                jQuery.error("Invalid XML: " + data);
            }
            return xml;
        },

        noop: function () { },

        // Evaluates a script in a global context
        // Workarounds based on findings by Jim Driscoll
        // http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
        // 一个 eval 的变种（eval()：函数可计算某个字符串，并执行其中的的 JavaScript 代码）
        // globalEval()函数用于全局性地执行一段JavaScript代码
        // 该方法跟eval方法相比有一个作用域的范围差异即始终处于全局作用域下面
        globalEval: function (data) {
            if (data && jQuery.trim(data)) {
                // We use execScript on Internet Explorer
                // We use an anonymous function so that context is window
                // rather than jQuery in Firefox
                // 如果 window.execScript 存在，则直接 window.execScript(data)
                // window.execScript 方法会根据提供的脚本语言执行一段脚本代码
                // 现在是在IE跟旧版本的Chrome是支持此方法的，新版浏览器没有 window.execScript 这个API
                (window.execScript || function (data) {
                    // 这里为何不能直接：eval.call( window, data );
                    // 在chrome一些旧版本里eval.call( window, data )无效
                    window["eval"].call(window, data);
                })(data);
            }
        },

        // Convert dashed to camelCase; used by the css and data modules
        // Microsoft forgot to hump their vendor prefix (#9572)
        // 驼峰表示法 例如将 font-size 变为 fontSize
        // 在很多需要兼容 IE 的地方用得上，例如 IE678 获取 CSS 样式的时候，使用
        // element.currentStyle.getAttribute(camelCase(style)) 传入的参数必须是驼峰表示法
        camelCase: function (string) {
            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        },

        // 获取 DOM 节点的节点名字或者判断其名字跟传入参数是否匹配
        nodeName: function (elem, name) {
            // IE下，DOM节点的nodeName是大写的，例如DIV
            // 所以统一转成小写再判断
            // 这里不return elem.nodeName.toLowerCase();
            // 我认为原因是为了保持浏览器自身的对外的规则，避免所有引用nodeName都要做转换的动作
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },

        // args is for internal usage only
        // 遍历一个数组或者对象
        // obj 是需要遍历的数组或者对象
        // callback 是处理数组/对象的每个元素的回调函数，它的返回值实际会中断循环的过程
        // args 是额外的参数数组
        each: function (obj, callback, args) {
            var value,
                i = 0,
                length = obj.length,
                isArray = isArrayLike(obj);
            // 传了第三个参数
            if (args) {
                if (isArray) {
                    for (; i < length; i++) {
                        // 相当于:
                        // args = [arg1, arg2, arg3];
                        // callback(args1, args2, args3)。然后callback里边的this指向了obj[i]
                        value = callback.apply(obj[i], args);
                        // 注意到，当callback函数返回值会false的时候，注意是全等！循环结束
                        if (value === false) {
                            break;
                        }
                    }
                } else {
                    for (i in obj) {
                        value = callback.apply(obj[i], args);
                        if (value === false) {
                            break;
                        }
                    }
                }
            } else {
                // 数组
                // 其实这里代码有点赘余，如果考虑代码的简洁性牺牲一点点性能
                // 在处理数组的情况下，也是可以用 for(i in obj)的
                if (isArray) {
                    for (; i < length; i++) {
                        // 相当于:
                        // args = [arg1, arg2, arg3];
                        // callback(args1, args2, args3)。然后callback里边的this指向了obj[i]
                        value = callback.apply(obj[i], i, obj[i]);
                        // 注意到，当callback函数返回值会false的时候，注意是全等！循环结束
                        if (value === false) {
                            break;
                        }
                    }
                } else {
                    for (i in obj) {
                        value = callback.apply(obj[i], i, obj[i]);
                        if (value === false) {
                            break;
                        }
                    }
                }
            }
        },
        // Use native String.trim function wherever possible
        // 去除字符串两端空格
        // core_trim = core_version.trim,
        // rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
        // \uFEFF 是 utf8 的字节序标记，详见：字节顺序标记 https://zh.wikipedia.org/wiki/%E4%BD%8D%E5%85%83%E7%B5%84%E9%A0%86%E5%BA%8F%E8%A8%98%E8%99%9F
        // \xA0 是全角空格
        trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
            // 如果已经支持原生的 String 的 trim 方法
            // 相当于等于下面这个方法 $.trim = function( text ) {...}
            function (text) {
                return text == null ?
                    "" :
                    core_trim.call(text);
            } :
            // Otherwise use our own trimming functionality
            // 不支持原生的 String 的 trim 方法
            function (text) {
                return text == null ?
                    "" :
                    // text + "" 强制类型转换 ，转换为 String 类型
                    (text + "").replace(rtrim, "");
            },
        // results is for internal usage only
        // 将类数组对象转换为数组对象
        // 此方法为内部方法
        makeArray: function (arr, results) {
            var ret = results || [];
            if (arr != null) {
                // 如果 arr 是一个类数组对象，调用 merge 合到返回值
                if (isArrayLike(Object(arr))) {
                    jQuery.merge(ret, typeof arr == 'string' ? [arr] : arr);
                } else {
                    // 如果不是数组，则将其放到返回数组末尾
                    // 等同于 ret.push(arr);
                    core_push.call(ret, arr);
                }
            }
            return ret;
        },

        // 在数组中查找指定值并返回它的索引（如果没有找到，则返回-1）
        // elem 规定需检索的值。
        // arr 数组
        // i 可选的整数参数。规定在数组中开始检索的位置。它的合法取值是 0 到 arr.length - 1。如省略该参数，则将从数组首元素开始检索。
        inArray: function (elem, arr, i) {
            var len;
            if (arr) {
                //如果支持原生的 indexOf 方法，直接调用
                // core_indexOf.call( arr, elem, i ) 相当于：
                // Array.indexOf.call(arr,elem, i)
                if (core_indexOf) {
                    return core_indexOf.call(arr, elem, i);
                }

                len = arr.length;
                i = i ? i < 0 ? Math.max(0, len + i) : i : 0;

                for (; i < len; i++) {
                    // Skip accessing in sparse arrays
                    // jQuery这里的(i in arr)判断是为了跳过稀疏数组中的元素
                    // 例如 var arr = []; arr[1] = 1;
                    // 此时 arr == [undefined, 1]
                    // 结果是 => (0 in arr == false) (1 in arr == true)
                    // 测试了一下 $.inArray(undefined, arr, 0)是返回 -1 的
                    for (i in arr && arr[i] == elem) {
                        return i;
                    }
                }
            }
            return -1;
        },

        // merge的两个参数必须为数组，作用就是修改第一个数组，使得它末尾加上第二个数组
        merge: function (first, second) {
            var l = second.length,
                i = first.length,
                j = 0;
            if (typeof l === 'number') {
                for (; j < l; j++) {
                    first[i++] = second[j];
                }
            } else {
                //{0: "a", 1: "b"}
                while (second[j] != undefined) {
                    first[i++] = second[j++];
                }
            }
            first.length = i;
            return first;
        },

        // 查找满足过滤函数的数组元素,原始数组不受影响
        // elems 是传入的数组，callback 是过滤器，inv 为 true 则返回那些被过滤掉的值






















    });






})(window);