# $.grep(array, callback, [invert])

概述

使用过滤函数过滤数组元素。

此函数至少传递两个参数：待过滤数组和过滤函数。过滤函数必须返回 true 以保留元素或 false 以删除元素。

参数： array,callback

- array:待过滤数组。

- callback:此函数将处理数组每个元素。第一个参数为当前元素，第二个参数而元素索引值。此函数应返回一个布尔值。另外，此函数可设置为一个字符串，当设置    为字符串时，将视为“lambda-form”（缩写形式？），其中 a 代表数组元素，i 代表元素索引值。如“a > 0”代表“function(a){ return a > 0; }”。

- invert:如果 "invert" 为 false 或为设置，则函数返回数组中由过滤函数返回 true 的元素，当"invert" 为 true，则返回过滤函数中返回 false 的元素集。

示例

描述:

过滤数组中小于 0 的元素。

jQuery 代码:

    $.grep( [0,1,2], function(n,i){
    	return n > 0;
    });

结果:

    [1, 2]

描述:

排除数组中大于 0 的元素，使用第三个参数进行排除。

jQuery 代码:

    $.grep( [0,1,2], function(n,i){
    	return n > 0;
    }, true);

结果:

    [0]