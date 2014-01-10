# Claire (-voyant) Files Backend
Claire is a fuzzy file finder heavily inspired by Emacs' [ido-mode](http://www.emacswiki.org/emacs/InteractivelyDoThings).
It implements a subset of the features ido-mode provides, with a few extra touches.

`claire-files` is specifically the file finding backend for claire plugin development. A claire plugin for Light Table is
being developed synchronously with this library, and can be found at my
[claire repository](http://github.com/joshuafcole/claire). The plugin is expected to frequently query the library as the
user refines her search and to provide intelligent completion based on the results provided.

Claire and its constituent parts are free as in liberty to use as you please to the greatest extent possible. The code is
clean, concise and thoroughly documented with comments. External API should stay consistent, but internal aspects
may change in the future to improve clarity and reusability.
