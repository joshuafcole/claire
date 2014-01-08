# Claire: The Fuzzy File Finding Light Table plugin with _Style_.
Claire is a fuzzy file finder heavily inspired by Emacs' [ido-mode](http://www.emacswiki.org/emacs/InteractivelyDoThings).
It implements a subset of the features ido-mode provides, with a few extra touches.

`claire` is specifically the LightTable plugin for the `claire-files` backend, which is being developed synchronously with
this plugin. The backend can be found in the [claire-files repository](http://github.com/joshuafcole/claire-files).

## Usage
1. Clone the claire package into your LT plugins directory.

    ```bash
        $ cd /path/to/config/LightTable/plugins && git clone https://github.com/joshuafcole/claire.git
    ```
2. Download the plugin dependencies via npm.

    ```bash
        $ cd claire/ && npm install
    ```
3. Load the claire default behaviors in your user.behaviors, or add your own to your user.keymap, found in:
    ```Light Table > View > Commands > User Behaviors```

    Add the following to the :app context.
    
    ```lisp
    (:lt.objs.plugins/load-keymap "plugins/claire/claire.keymap")
    ```

You're all set! Restart Light Table. If using the default keybindings, you can activate claire with C-x C-f. Interact by typing. <delete> is bound to smart-delete by default, <tab> is bound to smart-complete, and <enter> opens the current search term.

Claire and its constituent parts are free as in liberty to use as you please to the greatest extent possible. The code is
clean, concise and thoroughly documented with comments. External API should stay consistent, but internal aspects
may change in the future to improve clarity and reusability.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/joshuafcole/claire/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

