(defproject shelloid-clj-app "0.1.0-SNAPSHOT"
  :description "Shelloid Clojure Compute Service App"
  :url "http://shelloid.org"
  :license {:name "MIT License"
            :url "http://opensource.org/licenses/MIT" }
  :dependencies [
	[org.clojure/clojure "1.6.0"]
	[shelloid/ccs "0.1.1-SNAPSHOT"]
  ]
  :main ^:skip-aot ccs-app.main
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
