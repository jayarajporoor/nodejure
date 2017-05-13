; Copyright (c) Shelloid Systems LLP. All rights reserved.
; The use and distribution terms for this software are covered by the
; MIT License (http://opensource.org/licenses/MIT)
; which can be found in the file LICENSE at the root of this distribution.
; By using this software in any fashion, you are agreeing to be bound by
; the terms of this license.
; You must not remove this notice, or any other, from this software.
 
(ns ccs-app.main
    (:gen-class :main true)	
    (:use 
		[shelloid.server :only [start-server]]
    ) 
)

(defn -main [& args]
	(apply start-server args)
)
