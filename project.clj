(defproject claire "0.0.1-SNAPSHOT"
  :description "A LightTable native Emacs Inspired Fuzzy File Finder."
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [org.clojure/clojurescript "0.0-2014"]
                 [jayq "2.5.0"]
                 [crate "0.2.4"]]
  :plugins [[lein-cljsbuild "1.0.1-SNAPSHOT"]]
  :cljsbuild {:builds [{
                        :source-paths ["src"]
                        :compiler {
                                   :output-to "build/claire.js"
                                   :optimizations :simple
                                   :pretty-print true}}]}
  :main claire.main)
