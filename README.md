## Text 2 Checklist

A plugin that will build a checklist from the text of a textarea.

If the line starts with a '-' it will add a unchecked checkbox. otherwise of the line starts with a '+' it will add a checked checkbox.

See demo!

## API

```html
<textarea class="js-text-to-checklist"
	data-editable="true"
	data-checkable="true">
	**Bold header**

	Placeholder text. Fusce congue magna id eros malesuada
	- **Strong bullet point 1**
	- **Strong bullet point 1**
</textarea
```

#### Usage:

`$(".js-text-to-checklist").text2Checklist(opts);`

#### Options:

* `canEdit`: If the user can change the text of the textarea.

* `canCheck`: If the checklist is enabled

* `onChange`: Function that will be called when the text changes


#### Methods:

* `text2Checklist('init')`: Initialize the plugin. This is done when creating a new instance of text2Checklist

* `text2Checklist('value')`: Returns the current text value

* `text2Checklist('destroy')`: Destroy this instance of text2Checklist.

### Requirements:

* Jquery > 1.10
