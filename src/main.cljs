(ns claire.main
  (:require [crate.core :as crate])
  (:use-macros [crate.def-macros :only [defpartial]]))

(defn getdiv [name]
  (crate/html [:div.cool name]))

(def bar (first (.querySelectorAll js/document "#bottombar .content")))

(.appendChild bar (getdiv "test"))
