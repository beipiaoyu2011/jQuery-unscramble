#filter(expr | obj | ele | fn)

概述

筛选出与指定表达式匹配的元素集合。

这个方法用于缩小匹配的范围。用逗号分隔多个表达式

参数

- expr

	字符串值，包含供匹配当前元素集合的选择器表达式。

- jQuery object

	现有的jQuery对象，以匹配当前的元素。

- element 

	一个用于匹配元素的DOM元素。 

- function(index) Function

	一个函数用来作为测试元素的集合。它接受一个参数index，这是元素在jQuery集合的索引。在函数， this指的是当前的DOM元素。

参数selector描述:

	保留带有select类的元素

	HTML 代码:

    <p>Hello</p><p>Hello Again</p><p class="selected">And Again</p>

	jQuery 代码:

    $("p").filter(".selected")结果:

    [ <p class="selected">And Again</p> ]

	
	参数selector描述:

    保留第一个以及带有select类的元素
    
    HTML 代码:

    <p>Hello</p><p>Hello Again</p><p class="selected">And Again</p>
	
	jQuery 代码:

    $("p").filter(".selected, :first")结果:

    [ <p>Hello</p>, <p class="selected">And Again</p> ]
	
	回调函数 描述:

    保留子元素中不含有ol的元素。
    
    HTML 代码:

    <p><ol><li>Hello</li></ol></p><p>How are you?</p>
	
	jQuery 代码:
    $("p").filter(function(index) {
      return $("ol", this).length == 0;
    });

	结果:
    [ <p>How are you?</p> ]

