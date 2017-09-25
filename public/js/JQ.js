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


})(window);